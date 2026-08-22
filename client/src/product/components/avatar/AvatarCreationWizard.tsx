import { useMemo, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@product/components/ui/dialog";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@product/components/ui/select";
import {
  ArrowLeft, ArrowRight, ImagePlus, Loader2, Sparkles, X, ChevronDown, Wand2, Info,
  CheckCircle2, AlertTriangle, Crop, User,
} from "lucide-react";
import { cn } from "@product/lib/utils";
import { useToast } from "@product/hooks/use-toast";
import {
  createCustomAvatarPrompt,
  createCustomAvatarImage,
  type PresenterSpec,
  type ReferenceImage,
} from "@product/lib/heygen-api";
import { previewPrompt, summarise } from "@product/lib/presenterPrompt";
import {
  prepareImage, cropToFace, canCropToFace, isFailure, formatBytes,
  MIN_FACE_HEIGHT_FOR_CROP, type PreparedImage,
} from "@product/lib/prepareImage";
import { checkForFace, type FaceCheck } from "@product/lib/faceCheck";
import {
  RECIPES, GENDER_OPTIONS, AGE_OPTIONS, ETHNICITY_OPTIONS,
  STYLE_OPTIONS, POSE_OPTIONS, ORIENTATION_OPTIONS,
} from "./presenterRecipes";

/**
 * Creating a presenter.
 *
 * The version this replaces asked for a name and a paragraph of free text, then
 * sent that paragraph to HeyGen verbatim. Two problems, and they compound:
 * writing prompts for an image model is a skill our customers have no reason to
 * have, and the ten-minute wait meant every miss cost ten minutes to discover.
 * The result was generic faces and a lot of retries.
 *
 * This asks a different question. Pick the presenter closest to what you want,
 * adjust what matters, see what you are asking for before committing. The prompt
 * is assembled by the server from those choices, so the floor on quality is set
 * by us rather than by how practised the customer is at describing a human.
 *
 * Three steps, because there are genuinely three decisions: what kind of
 * presenter, what they look like, and whether to send it.
 */

const IMG_ALLOWED = ["image/jpeg", "image/jpg", "image/png"];
const IMG_MAX_BYTES = 10 * 1024 * 1024;
const MAX_REFERENCES = 3;

interface AvatarCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type Mode = "describe" | "photo";

/**
 * The screens, and the order each path visits them.
 *
 * This replaces a `step` counter, which could not survive splitting the mode
 * choice onto its own screen: the two paths are now different lengths, so
 * "step 2 of 3" was about to start lying to one of them. Naming the screens and
 * listing the route per mode makes next, back and the progress bar fall out of
 * one array lookup, and makes an impossible state unrepresentable.
 *
 * The photo path skips the old name-only screen. It asked for a name and said
 * "there is nothing else to choose here" — and the review screen it led to
 * already asks for the name. It was a whole screen to collect a field the next
 * screen collected again.
 */
type Screen = "mode" | "recipe" | "photo" | "refine" | "review";

const FLOW: Record<Mode, Screen[]> = {
  describe: ["mode", "recipe", "refine", "review"],
  photo: ["mode", "photo", "review"],
};

/*
  The fork. Two ways to get a presenter, given equal weight and enough room to
  read as a decision — the version this replaces rendered them as two thin
  strips above a grid of six recipes, where they looked like a filter control
  rather than the choice the whole flow turns on.
*/
const MODES: { id: Mode; Icon: typeof Sparkles; title: string; body: string; cta: string }[] = [
  {
    id: "describe",
    Icon: Sparkles,
    title: "Generate one",
    body: "Describe the presenter you want and we build them from nothing.",
    cta: "Pick a starting point",
  },
  {
    id: "photo",
    Icon: ImagePlus,
    title: "Use a photo",
    body: "Upload a real face and we turn it into a presenter.",
    cta: "Upload a photo",
  },
];

const HEADINGS: Record<Screen, string> = {
  mode: "There are two ways to make one. Both take about five minutes.",
  recipe: "Pick the presenter closest to what you want. You can change every detail next.",
  photo: "One clear face, looking at the camera. We check it before anything is spent.",
  refine: "Adjust anything that matters. Everything here is optional.",
  review: "This is what will be generated.",
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    // readAsDataURL yields "data:image/png;base64,AAA…"; the API forwards the
    // payload only, so the prefix comes off here rather than on the server.
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export function AvatarCreationWizard({ open, onOpenChange, onCreated }: AvatarCreationWizardProps) {
  const { toast } = useToast();

  const [screen, setScreen] = useState<Screen>("mode");
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>("describe");
  const [recipeId, setRecipeId] = useState<string | null>(null);
  /*
    Photoreal or animated.

    This existed already, as one entry in a six-item Style dropdown two screens
    later — "Pixar", labelled "Animated". That is the wrong place for it: it is
    not a refinement of a presenter, it is which kind of presenter you are
    making, and it changes every other choice on the screen. An animated
    presenter is a different product decision, so it is asked as one.
  */
  const [look, setLook] = useState<"realistic" | "animated">("realistic");

  const [name, setName] = useState("");
  const [spec, setSpec] = useState<PresenterSpec>({});
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  const [photo, setPhoto] = useState<PreparedImage | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoChecking, setPhotoChecking] = useState(false);
  const [faceCheck, setFaceCheck] = useState<FaceCheck | null>(null);
  const [faceChecking, setFaceChecking] = useState(false);
  // Picking a second photo while the first is still being examined would
  // otherwise let the stale verdict land on top of the new one.
  const faceRun = useRef(0);
  const [cropping, setCropping] = useState(false);
  /*
    What the photo is FOR.

    Picking "Use a photo" and getting your exact snapshot animated is not what
    most people mean. They mean "make me a presenter, here is my face". Both
    routes always existed — HeyGen animates the image directly, or generates a
    new presenter from it as a likeness reference — but the second was reachable
    only through a small link that appeared once the first had already failed.
    The better option was hidden behind a failure.

    Both are now shown as soon as there is a photo, each stating what it
    produces and whether this particular photo is good enough for it.
  */
  const [photoUse, setPhotoUse] = useState<"exact" | "likeness">("exact");
  const photoInput = useRef<HTMLInputElement>(null);

  const [references, setReferences] = useState<{ file: File; url: string }[]>([]);
  const refInput = useRef<HTMLInputElement>(null);

  const set = <K extends keyof PresenterSpec>(key: K, value: PresenterSpec[K]) =>
    setSpec((s) => ({ ...s, [key]: value }));

  const reset = () => {
    setScreen("mode");
    setMode("describe");
    setRecipeId(null);
    setLook("realistic");
    setName("");
    setSpec({});
    setShowFullPrompt(false);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview(null);
    setPhotoChecking(false);
    setPhotoUse("exact");
    setFaceCheck(null);
    setFaceChecking(false);
    faceRun.current++;
    references.forEach((r) => URL.revokeObjectURL(r.url));
    setReferences([]);
    setSubmitting(false);
  };

  const close = (next: boolean) => {
    if (submitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const validImage = (file: File) => {
    if (!IMG_ALLOWED.includes(file.type)) {
      toast({ title: "Use a JPG or PNG", description: `${file.name} is not a supported image.`, variant: "destructive" });
      return false;
    }
    if (file.size > IMG_MAX_BYTES) {
      toast({ title: "That image is too large", description: "Keep it under 10MB.", variant: "destructive" });
      return false;
    }
    return true;
  };

  /*
    Fix the framing instead of asking for a better photo.

    The face check is advisory, and the natural response to "your photo is not
    ideal" is to use it anyway — which is how a full-body garden shot became a
    presenter. Since the detector already returns where the face is, the product
    can crop to a proper headshot itself rather than sending someone away to
    find another picture.
  */
  const cropPhoto = async () => {
    if (!photo || !faceCheck?.box) return;
    setCropping(true);
    try {
      const result = await cropToFace(photo.file, faceCheck.box);
      if (isFailure(result)) {
        toast({ title: "Couldn't crop that", description: result.problem, variant: "destructive" });
        return;
      }
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhoto(result);
      setPhotoPreview(URL.createObjectURL(result.file));

      // Re-check the crop rather than assuming it worked.
      const run = ++faceRun.current;
      setFaceCheck(null);
      setFaceChecking(true);
      const face = await checkForFace(result.file);
      if (faceRun.current !== run) return;
      setFaceCheck(face);
      setFaceChecking(false);
    } finally {
      setCropping(false);
    }
  };

  /*
    Turn an unusable photo into a usable presenter.

    A photo avatar IS the photo — HeyGen animates the picture you gave it. So a
    full-body garden shot becomes a presenter who is a full-body garden shot,
    which is what "the system just uploaded the image and did not create an
    avatar" actually describes. It did create one; the input was simply never
    a portrait.

    The generate path already accepts reference images and passes them to
    HeyGen, so the same photo can be used the other way round: not as the
    presenter, but as the likeness a properly framed, studio-lit presenter is
    generated from. That is the outcome someone uploading a photo of themselves
    is usually after.
  */
  const useAsReference = () => {
    if (!photo) return;
    setReferences((prev) =>
      prev.length >= MAX_REFERENCES
        ? prev
        : [...prev, { file: photo.file, url: URL.createObjectURL(photo.file) }]
    );
    setMode("describe");
    setScreen("recipe");
  };

  const pickRecipe = (id: string, withLook: "realistic" | "animated" = look) => {
    const recipe = RECIPES.find((r) => r.id === id);
    if (!recipe) return;
    setRecipeId(id);
    /*
      The recipe carries a photographic style — Realistic or Cinematic. An
      animated presenter overrides it, because "cinematic colour grade, shot on
      an 85mm anamorphic lens" is direction for a camera, and there is no camera.
    */
    setSpec({
      ...recipe.spec,
      style: withLook === "animated" ? "Pixar" : recipe.spec.style,
    });
  };

  /* Switching look re-applies it to a recipe already chosen. */
  const chooseLook = (next: "realistic" | "animated") => {
    setLook(next);
    if (recipeId) pickRecipe(recipeId, next);
  };

  const promptText = useMemo(() => previewPrompt(spec), [spec]);
  const summary = useMemo(() => summarise(spec), [spec]);

  const flow = FLOW[mode];
  const idx = Math.max(0, flow.indexOf(screen));
  const isLast = idx === flow.length - 1;

  const go = (delta: number) => {
    const next = flow[idx + delta];
    if (next) setScreen(next);
    else if (delta < 0) close(false);
  };

  /*
    Choosing a mode or a recipe moves you on by itself. Both screens are a
    single decision with the options fully visible, so a Continue button would
    only be a second click confirming what the first click already said — and
    it would sit there greyed out until you made it, which reads as the dialog
    being broken rather than waiting.
  */
  const chooseMode = (m: Mode) => {
    setMode(m);
    setScreen(FLOW[m][1]);
  };

  const chooseRecipe = (id: string) => {
    pickRecipe(id);
    setScreen("refine");
  };

  /*
    Continue on the photo screen means "take this route", not just "next".

    The likeness route is a different pipeline — the photo becomes a reference
    and the presenter is generated — so it hands off to the recipe screen
    instead of walking on to review.
  */
  const continueFromPhoto = () => {
    if (photoUse === "likeness") useAsReference();
    else go(1);
  };

  // Only the screens that are not self-advancing need the button.
  const showContinue = screen === "photo" || screen === "refine";
  const canContinue = screen === "photo" ? !!photo : true;
  const canSubmit = !!name.trim() && (mode === "photo" ? !!photo : !!recipeId);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (mode === "photo") {
        await createCustomAvatarImage({ name: name.trim(), image: photo!.file });
      } else {
        const referenceImages: ReferenceImage[] = await Promise.all(
          references.map(async (r) => ({
            data: await fileToBase64(r.file),
            media_type: r.file.type,
          }))
        );
        await createCustomAvatarPrompt({ name: name.trim(), spec, referenceImages });
      }

      toast({
        title: "Generating your presenter",
        description: "It appears in the studio when it is ready. You can carry on working.",
      });
      onCreated();
      close(false);
    } catch (err: any) {
      toast({
        title: "Couldn't start generation",
        description: err?.message || "Something went wrong. Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New presenter</DialogTitle>
          <DialogDescription>{HEADINGS[screen]}</DialogDescription>
        </DialogHeader>

        {/*
          Nothing to show on the fork: you have not started a path yet, and the
          two paths are different lengths, so any bar drawn here would be
          guessing at one of them. It appears once the route is known.
        */}
        {screen !== "mode" && (
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {flow.slice(1).map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors duration-300",
                  i < idx ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        )}

        {/* ── The fork ─────────────────────────────────────────────────── */}
        {screen === "mode" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMode(m.id)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-border/70 bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/[0.04] hover:shadow-[0_10px_28px_-16px_rgba(12,43,74,.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                  <m.Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span>
                  <span className="block text-[15.5px] font-semibold text-foreground">{m.title}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">{m.body}</span>
                </span>
                <span className="mt-auto flex items-center gap-1 pt-1 text-[12.5px] font-semibold text-primary">
                  {m.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── Starting points ──────────────────────────────────────────── */}
        {screen === "recipe" && (
          <div className="space-y-4">
            {/*
              Asked before the recipe, because it changes what every recipe
              below means. Two options rather than a dropdown: there are only
              two, and both deserve to be readable without opening anything.
            */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {([
                {
                  id: "realistic" as const,
                  title: "Realistic",
                  body: "A photoreal person. What most B2B audiences expect from a founder on camera.",
                },
                {
                  id: "animated" as const,
                  title: "Animated",
                  body: "A stylised 3D character. Distinctive, and it never sits in the uncanny valley.",
                },
              ]).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => chooseLook(opt.id)}
                  className={cn(
                    "rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    look === opt.id
                      ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                      : "border-border/70 hover:border-primary/45 hover:bg-secondary/50"
                  )}
                >
                  <span className="block text-[14px] font-semibold text-foreground">
                    {opt.title}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-muted-foreground">
                    {opt.body}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
            {RECIPES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => chooseRecipe(r.id)}
                className={cn(
                  "group rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  recipeId === r.id
                    ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                    : "border-border/70 hover:border-primary/45 hover:bg-secondary/50 hover:shadow-[0_8px_20px_-14px_rgba(12,43,74,.4)]"
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[14.5px] font-semibold text-foreground">{r.label}</span>
                  <ArrowRight className="h-4 w-4 flex-none text-primary opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100 motion-reduce:transform-none" />
                </span>
                <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">
                  {r.blurb}
                </span>
                {/*
                  What this presenter actually looks like. The name alone is
                  opaque — nobody can picture "Analyst" — and guessing wrong
                  costs a real generation and a long wait to find out.
                */}
                <span className="mt-2.5 flex flex-wrap gap-1">
                  {(look === "animated"
                    ? ["Animated", ...r.chips.slice(1)]
                    : r.chips
                  ).map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-secondary px-2 py-0.5 text-[11.5px] font-medium text-secondary-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </span>
              </button>
            ))}
            </div>
          </div>
        )}

        {/* ── Photo ────────────────────────────────────────────────────── */}
        {screen === "photo" && (
              <div className="space-y-3">
                <input
                  ref={photoInput}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    // Reset the input so re-picking the same file after a
                    // rejection still fires a change event.
                    e.target.value = "";
                    if (!f || !validImage(f)) return;

                    setPhotoChecking(true);
                    const result = await prepareImage(f);
                    setPhotoChecking(false);

                    if (isFailure(result)) {
                      toast({
                        title: "That photo won't work",
                        description: result.problem,
                        variant: "destructive",
                      });
                      return;
                    }

                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhoto(result);
                    setPhotoPreview(URL.createObjectURL(result.file));

                    // Look for a face in the background. The photo is already
                    // accepted at this point — this only ever adds advice, so
                    // it must not hold up the person who is ready to continue.
                    const run = ++faceRun.current;
                    setFaceCheck(null);
                    setFaceChecking(true);
                    const face = await checkForFace(result.file);
                    if (faceRun.current !== run) return;
                    setFaceCheck(face);
                    setFaceChecking(false);
                  }}
                />

                {photoChecking ? (
                  <div className="flex h-44 w-44 items-center justify-center rounded-xl border border-dashed border-border">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : photoPreview && photo ? (
                  <div className="flex flex-wrap items-start gap-4">
                    {/* A 176px preview rather than a thumbnail: this is the face
                        that will front every video, and a stamp-sized image
                        hides exactly the problems worth catching. */}
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Selected photo"
                        className="h-44 w-44 rounded-xl border border-border object-cover"
                      />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => {
                          URL.revokeObjectURL(photoPreview);
                          setPhoto(null);
                          setPhotoPreview(null);
                          setFaceCheck(null);
                          setFaceChecking(false);
                          faceRun.current++;
                        }}
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1 text-[13px]">
                      <p className="font-semibold text-foreground">
                        {photo.width}×{photo.height}
                        <span className="ml-2 font-normal text-muted-foreground">
                          {formatBytes(photo.file.size)}
                        </span>
                      </p>
                      {photo.originalWidth && (
                        <p className="text-muted-foreground">
                          Resized from {photo.originalWidth}×{photo.originalHeight} so it
                          uploads quickly. No detail a face model uses is lost.
                        </p>
                      )}
                      {faceChecking && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Checking the framing&hellip;
                        </p>
                      )}

                      {/* "unknown" prints nothing on purpose: a detector that
                          could not run has no opinion, and inventing one would
                          only worry someone whose photo is fine. */}
                      {!faceChecking && faceCheck?.verdict === "ok" && (
                        <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5 flex-none" />
                          One face, well framed.
                        </p>
                      )}

                      {!faceChecking && faceCheck?.note && (
                        <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="mt-px h-3.5 w-3.5 flex-none" />
                          <span className="leading-relaxed">{faceCheck.note}</span>
                        </p>
                      )}

                      {/*
                        Offered only when there is a face to crop around. This is
                        the difference between telling someone their photo is
                        wrong and handing them a corrected one.
                      */}
                      {/*
                        Only offered when it would actually help. Cropping a
                        small face produces a correctly-framed but far too small
                        image, and upscaling it back over the limit would hide
                        the problem behind a green tick rather than solve it.
                      */}
                      {!faceChecking &&
                        faceCheck?.verdict === "small" &&
                        faceCheck.box &&
                        canCropToFace(faceCheck.box, photo.width, photo.height) && (
                        <button
                          type="button"
                          onClick={cropPhoto}
                          disabled={cropping}
                          className="flex items-center gap-1.5 rounded-lg border border-primary/45 bg-primary/[0.06] px-2.5 py-1.5 text-[12.5px] font-semibold text-primary transition-colors hover:bg-primary/[0.12] disabled:opacity-60"
                        >
                          {cropping ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Crop className="h-3.5 w-3.5" />
                          )}
                          {cropping ? "Cropping" : "Crop to the face for me"}
                        </button>
                        )}

                      {/*
                        When cropping cannot help, say what photo would — a
                        measurement someone can act on, not "use a better photo".
                      */}
                      {!faceChecking &&
                        faceCheck?.verdict === "small" &&
                        faceCheck.box &&
                        !canCropToFace(faceCheck.box, photo.width, photo.height) && (
                          <p className="leading-relaxed text-muted-foreground">
                            Cropping won't help here — the face is only{" "}
                            {Math.round(faceCheck.box.height)}px tall and needs about{" "}
                            {MIN_FACE_HEIGHT_FOR_CROP}px. Take one where your head and
                            shoulders fill the frame.
                          </p>
                        )}


                      <button
                        type="button"
                        onClick={() => photoInput.current?.click()}
                        className="text-[12.5px] font-semibold text-primary"
                      >
                        Choose a different photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => photoInput.current?.click()} className="gap-2">
                    <ImagePlus className="h-4 w-4" /> Choose a photo
                  </Button>
                )}

                {/*
                  Both routes, side by side, as soon as there is a photo.

                  Each says what it produces and whether this photo is good
                  enough for it, so the choice is never made blind — and the
                  better option is no longer something you discover by failing.
                */}
                {photo && !photoChecking && (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {(
                      [
                        {
                          id: "exact" as const,
                          Icon: User,
                          title: "Use this exact face",
                          body: "Your photo becomes the presenter. HeyGen animates it and syncs the lips.",
                          ok: faceCheck?.verdict === "ok" || faceCheck?.verdict === "unknown",
                          okNote: "This photo works",
                          badNote: "Needs a head-and-shoulders photo",
                        },
                        {
                          id: "likeness" as const,
                          Icon: Sparkles,
                          title: "Generate someone who looks like this",
                          body: "We build a new, studio-lit presenter from your likeness, properly framed.",
                          ok: true,
                          okNote: "Works with any clear photo",
                          badNote: "",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPhotoUse(opt.id)}
                        className={cn(
                          "rounded-xl border p-3.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          photoUse === opt.id
                            ? "border-primary bg-primary/[0.07] ring-1 ring-primary"
                            : "border-border/70 hover:border-primary/45 hover:bg-secondary/50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <opt.Icon className="h-4 w-4 flex-none text-primary" strokeWidth={2} />
                          <span className="text-[14px] font-semibold text-foreground">
                            {opt.title}
                          </span>
                        </span>
                        <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">
                          {opt.body}
                        </span>
                        <span
                          className={cn(
                            "mt-2 flex items-center gap-1 text-[12px] font-medium",
                            opt.ok
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-amber-700 dark:text-amber-400"
                          )}
                        >
                          {opt.ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          )}
                          {opt.ok ? opt.okNote : opt.badNote}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2.5 rounded-xl border border-primary/15 bg-primary/[0.06] p-3.5">
                  <Info className="mt-px h-4 w-4 flex-none text-primary" strokeWidth={2} />
                  <p className="text-[13px] leading-relaxed text-foreground/80">
                    One face, looking straight at the camera, evenly lit, filling most
                    of the frame. Side profiles, sunglasses and masks all fail. Size,
                    shape and framing are checked here before anything is spent.
                  </p>
                </div>
              </div>
        )}

        {/* ── Refine ───────────────────────────────────────────────────── */}
        {screen === "refine" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Gender">
                <Picker value={spec.gender || "Unspecified"} onChange={(v) => set("gender", v as PresenterSpec["gender"])}
                  options={GENDER_OPTIONS.map((g) => ({ value: g, label: g === "Unspecified" ? "Any" : g }))} />
              </Field>
              <Field label="Age">
                <Picker value={spec.age || "Unspecified"} onChange={(v) => set("age", v as PresenterSpec["age"])}
                  options={AGE_OPTIONS.map((a) => ({ value: a.value, label: a.label }))} />
              </Field>
              <Field label="Ethnicity">
                <Picker value={spec.ethnicity || "Unspecified"} onChange={(v) => set("ethnicity", v as PresenterSpec["ethnicity"])}
                  options={ETHNICITY_OPTIONS.map((e) => ({ value: e, label: e === "Unspecified" ? "Any" : e }))} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Look">
                <Picker value={spec.style || "Realistic"} onChange={(v) => set("style", v as PresenterSpec["style"])}
                  options={STYLE_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} />
              </Field>
              <Field label="Framing">
                <Picker value={spec.pose || "half_body"} onChange={(v) => set("pose", v as PresenterSpec["pose"])}
                  options={POSE_OPTIONS.map((p) => ({ value: p.value, label: p.label }))} />
              </Field>
              <Field label="Shape">
                <Picker value={spec.orientation || "vertical"} onChange={(v) => set("orientation", v as PresenterSpec["orientation"])}
                  options={ORIENTATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Expression">
                <Input value={spec.expression || ""} onChange={(e) => set("expression", e.target.value)} placeholder="warm and approachable" />
              </Field>
              <Field label="Wearing">
                <Input value={spec.wardrobe || ""} onChange={(e) => set("wardrobe", e.target.value)} placeholder="a navy blazer over a white shirt" />
              </Field>
            </div>

            <Field label="Background">
              <Input value={spec.setting || ""} onChange={(e) => set("setting", e.target.value)} placeholder="a softly lit modern office" />
            </Field>

            {/* Reference images: three, in the same request, at no extra cost. */}
            <div>
              <Label className="text-[13px] font-semibold">
                Reference images{" "}
                <span className="font-normal text-muted-foreground">(optional, up to {MAX_REFERENCES})</span>
              </Label>
              <p className="mb-2 mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                The strongest steer available. Add a look, a wardrobe or a lighting reference.
              </p>
              <input
                ref={refInput}
                type="file"
                accept=".jpg,.jpeg,.png"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const picked = Array.from(e.target.files || []).filter(validImage);
                  e.target.value = "";

                  /*
                    Shrunk before they are held, not at send time.

                    These are base64-encoded into the request body, which
                    inflates them by a third — a couple of full-size phone
                    photos exceeded the server's body limit and the generation
                    failed with "request entity too large". Downscaling costs
                    nothing here: HeyGen reads them for likeness, and a face is
                    perfectly legible at 1536px.

                    A file that fails preparation is skipped rather than
                    dropped silently — prepareImage refuses images too small to
                    be useful as a reference anyway.
                  */
                  const prepared = await Promise.all(
                    picked.map(async (f) => {
                      const result = await prepareImage(f);
                      if (isFailure(result)) return null;
                      return { file: result.file, url: URL.createObjectURL(result.file) };
                    })
                  );

                  const usable = prepared.filter(
                    (r): r is { file: File; url: string } => r !== null
                  );

                  if (usable.length < picked.length) {
                    toast({
                      title: "Some references were skipped",
                      description: "Reference images need to be at least 512x512.",
                    });
                  }

                  setReferences((prev) => [...prev, ...usable].slice(0, MAX_REFERENCES));
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                {references.map((r, i) => (
                  <div key={r.url} className="relative">
                    <img src={r.url} alt="" className="h-16 w-16 rounded-lg border border-border object-cover" />
                    <button
                      type="button"
                      aria-label={`Remove reference ${i + 1}`}
                      onClick={() => {
                        URL.revokeObjectURL(r.url);
                        setReferences((prev) => prev.filter((x) => x.url !== r.url));
                      }}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {references.length < MAX_REFERENCES && (
                  <Button variant="outline" size="sm" onClick={() => refInput.current?.click()} className="h-16 gap-2 px-4">
                    <ImagePlus className="h-4 w-4" /> Add
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Review ───────────────────────────────────────────────────── */}
        {screen === "review" && (
          <div className="space-y-4">
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maya, our head of sales" autoFocus />
            </Field>

            {mode === "describe" && (
              <div className="rounded-xl border border-border/70 bg-secondary/40 p-4">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Wand2 className="h-3.5 w-3.5" /> What we'll generate
                </p>
                <p className="text-[14.5px] leading-relaxed text-foreground">{summary}</p>

                {/*
                  The full prompt is available but not in the way. Six hundred
                  characters of lens specifications is proof of work, not
                  communication — worth seeing once, tiring on every visit.
                */}
                <button
                  type="button"
                  onClick={() => setShowFullPrompt((v) => !v)}
                  className="mt-3 flex items-center gap-1 text-[12.5px] font-semibold text-primary"
                >
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showFullPrompt && "rotate-180")} />
                  {showFullPrompt ? "Hide" : "See"} the exact prompt
                </button>
                {showFullPrompt && (
                  <p className="mt-2 rounded-lg border border-border/70 bg-card p-3 font-mono text-[12px] leading-relaxed text-muted-foreground">
                    {promptText}
                  </p>
                )}
              </div>
            )}

            {mode === "describe" && references.length > 0 && (
              <p className="text-[13px] text-muted-foreground">
                Plus {references.length} reference image{references.length > 1 ? "s" : ""}.
              </p>
            )}

            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Generation runs on HeyGen and takes a few minutes. You can close this
              and keep working — it appears in the studio when it is ready.
            </p>
          </div>
        )}

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => go(-1)}
            disabled={submitting}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            {idx === 0 ? "Cancel" : "Back"}
          </Button>

          {showContinue ? (
            <Button
              onClick={() => (screen === "photo" ? continueFromPhoto() : go(1))}
              disabled={!canContinue}
              className="gap-1.5"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : isLast ? (
            <Button variant="cta" onClick={handleSubmit} disabled={!canSubmit || submitting} className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Starting" : "Generate presenter"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Small local pieces ─────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold">{label}</Label>
      {children}
    </div>
  );
}

function Picker({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default AvatarCreationWizard;
