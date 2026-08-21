import { useState, useEffect, useMemo } from "react";
import { Button } from "@product/components/ui/button";
import { Input } from "@product/components/ui/input";
import { Label } from "@product/components/ui/label";
import { Textarea } from "@product/components/ui/textarea";
import { Badge } from "@product/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@product/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@product/components/ui/select";
import { 
  Building2, Users, Target, AlertTriangle, Zap, Globe, MessageSquare, Palette,
  Plus, X, Save, Loader2, Package, RefreshCw
} from "lucide-react";
import { ICPData, fetchICPByCampaign, updateICPData, createOrUpdateICP } from "@product/lib/api";
import { useToast } from "@product/hooks/use-toast";
import { suggestionsFor } from "@product/components/icp/icpSuggestions";

interface ICPFormProps {
  campaignId: string;
  onSave?: () => void;
  onDataChange?: (data: ICPData, name?: string) => void;
  onSaveComplete?: () => void;
}

const INDUSTRY_OPTIONS = [
  "Technology / SaaS", "Healthcare", "Financial Services", "Manufacturing",
  "Retail / E-commerce", "Professional Services", "Education", "Real Estate",
  "Media / Entertainment", "Other"
];

const COMPANY_SIZE_OPTIONS = [
  "1-10 employees (Startup)", "11-50 employees (Small)", "51-200 employees (Medium)",
  "201-1000 employees (Mid-Market)", "1001-5000 employees (Enterprise)", "5000+ employees (Large Enterprise)"
];

const CONTENT_TONE_OPTIONS = [
  { value: "professional", label: "Professional & Formal" },
  { value: "conversational", label: "Conversational & Friendly" },
  { value: "authoritative", label: "Authoritative & Expert" },
  { value: "empathetic", label: "Empathetic & Supportive" },
  { value: "bold", label: "Bold & Direct" },
  { value: "educational", label: "Educational & Informative" }
];

const REGION_OPTIONS = [
  "North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa", "Global"
];

/**
 * Clickable starting points under a list field.
 *
 * The three fields that decide what every video says — roles, pain points,
 * buying triggers — were empty boxes with one example in the placeholder.
 * These are real options for the industry already chosen, so the answer to
 * "what goes here?" is on screen rather than in the customer's head.
 *
 * Anything already added disappears from the row, so the suggestions shrink as
 * the list fills instead of offering duplicates.
 */
function Suggestions({
  options,
  chosen,
  onAdd,
}: {
  options: string[];
  chosen: string[];
  onAdd: (value: string) => void;
}) {
  const remaining = options.filter((o) => !chosen.includes(o));
  if (remaining.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Common for this industry
      </p>
      <div className="flex flex-wrap gap-1.5">
        {remaining.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onAdd(o)}
            className="rounded-md border border-dashed border-border bg-transparent px-2.5 py-1 text-[12.5px] text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            + {o}
          </button>
        ))}
      </div>
    </div>
  );
}

const DEFAULT_DATA: ICPData = {
  industry: null, companySize: null, roles: [], painPoints: [], buyingTriggers: [],
  regions: [], messagingAngles: [], solution: null, contentTone: null, additionalNotes: ""
};

export function ICPForm({ campaignId, onSave, onDataChange, onSaveComplete }: ICPFormProps) {
  const [formData, setFormData] = useState<ICPData>(DEFAULT_DATA);
  const [icpName, setIcpName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  /*
    A failed load, as distinct from "this campaign has no ICP yet". Surfaced as
    a banner above the form so the person knows the blank fields in front of
    them are a loading failure, not their data.
  */
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [newPainPoint, setNewPainPoint] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newAngle, setNewAngle] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  /**
   * Returns what is missing, rather than just whether anything is.
   *
   * These exact strings were already being computed and were used only to turn
   * three borders red — the message said "Please fill in all required fields",
   * which names nothing. If the page happened to be scrolled, the red borders
   * were off-screen too, so the customer was told something was wrong and given
   * no way to find out what.
   */
  /* Recomputed when the industry changes, so picking "Healthcare" immediately
     changes what the three list fields suggest. */
  const suggestions = useMemo(() => suggestionsFor(formData.industry), [formData.industry]);

  const findMissing = (): string[] => {
    const errors: string[] = [];
    if (!formData.industry) errors.push("Industry is required");
    if (!formData.companySize) errors.push("Company size is required");
    if (formData.roles.length === 0) errors.push("At least one target role is required");
    setValidationErrors(errors);
    return errors;
  };

  const validateForm = (): boolean => findMissing().length === 0;

  useEffect(() => {
    loadICPData();
  }, [campaignId]);

  useEffect(() => {
    onDataChange?.(formData, icpName);
  }, [formData, icpName, onDataChange]);

  const loadICPData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const profile = await fetchICPByCampaign(campaignId);
      setFormData(profile.data || DEFAULT_DATA);
      setIcpName(profile.name || "");
      setIsNew(false);
    } catch (err: any) {
      /*
        Only a 404 means "no ICP yet".

        This catch used to treat every failure as a new profile: it reset the
        form to DEFAULT_DATA and set isNew. So a single failed request showed
        somebody their carefully filled-in ICP — industry, company size, roles,
        pain points, buying triggers, messaging angles — as a completely blank
        form. Worse, `isNew` then makes Save create a SECOND profile rather than
        update the existing one, so the recovery action silently duplicates.
      */
      if (err?.status === 404) {
        setFormData(DEFAULT_DATA);
        setIcpName("");
        setIsNew(true);
        setLoadError(null);
      } else {
        setLoadError(err?.message || "Couldn't load this ICP. Your saved answers are safe.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const missing = findMissing();
    if (missing.length) {
      // Named, and the fields are listed in the order they appear on the page.
      const fields = missing
        .map((m) => m.replace(/ is required$/, "").replace(/^At least one /, "a "))
        .map((m, i) => (i === 0 ? m : m.toLowerCase()));
      const sentence =
        fields.length === 1
          ? fields[0]
          : `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`;
      toast({
        title: "A few things are still missing",
        description: `Add ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)} before saving.`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isNew) {
        await createOrUpdateICP(campaignId, { data: formData });
        setIsNew(false);
      } else {
        await updateICPData(campaignId, formData);
      }
      toast({ title: "ICP Saved", description: "Your ICP profile has been updated successfully." });
      onSave?.();
      onSaveComplete?.();
    } catch (error) {
      toast({ title: "Error saving ICP", description: "Could not save ICP data.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addToList = (field: keyof ICPData, value: string, clearFn: (v: string) => void) => {
    if (!value.trim()) return;
    const currentList = formData[field] as string[];
    if (!currentList.includes(value.trim())) {
      setFormData(prev => ({ ...prev, [field]: [...currentList, value.trim()] }));
    }
    clearFn("");
  };

  const removeFromList = (field: keyof ICPData, value: string) => {
    const currentList = formData[field] as string[];
    setFormData(prev => ({ ...prev, [field]: currentList.filter(item => item !== value) }));
  };

  const toggleRegion = (region: string) => {
    if (formData.regions.includes(region)) {
      removeFromList("regions", region);
    } else {
      setFormData(prev => ({ ...prev, regions: [...prev.regions, region] }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const errorBanner = loadError ? (
    <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-4">
      <AlertTriangle className="mt-0.5 h-[18px] w-[18px] flex-none text-destructive" strokeWidth={1.9} />
      <div className="flex-1">
        <p className="text-[14px] font-semibold text-foreground">Couldn't load this ICP</p>
        <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">
          {loadError} Nothing has been changed — reload before editing so you do
          not overwrite what is saved.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={loadICPData} className="flex-none gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  ) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {errorBanner}
        {/* Industry & Company Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={!formData.industry && validationErrors.length > 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="w-4 h-4 text-primary" />
                Industry <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>Target industry vertical</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={formData.industry || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, industry: v }))}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className={!formData.companySize && validationErrors.length > 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" />
                Company size <span className="text-destructive">*</span>
              </CardTitle>
              <CardDescription>Target company employee count</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={formData.companySize || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, companySize: v }))}>
                <SelectTrigger><SelectValue placeholder="Select company size" /></SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Solution / Product Being Sold */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4 text-primary" />
              Solution / Product Being Sold
            </CardTitle>
            <CardDescription>
              Describe the product or service being sold to this ICP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="eg., AI Sales Video Platform, CRM Software, Cybersecurity Service, Marketing Agency, Lead Generation Solution"
              value={formData.solution || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
              rows={3}
            />
          </CardContent>
        </Card>

        <Card className={formData.roles.length === 0 && validationErrors.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" />
              Target roles & titles <span className="text-destructive">*</span>
            </CardTitle>
            <CardDescription>Decision makers and influencers you want to reach</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="e.g., VP of Sales, CTO" value={newRole} onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addToList("roles", newRole, setNewRole)} />
              <Button variant="outline" size="icon" onClick={() => addToList("roles", newRole, setNewRole)}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.roles.map(role => (
                <Badge key={role} variant="secondary" className="gap-1 pr-1">
                  {role}
                  <button onClick={() => removeFromList("roles", role)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <Suggestions
              options={suggestions.roles}
              chosen={formData.roles}
              onAdd={(v) => addToList("roles", v, setNewRole)}
            />
          </CardContent>
        </Card>

        {/* Pain Points */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="w-4 h-4 text-primary" />Pain Points</CardTitle>
            <CardDescription>Challenges and problems your ICP faces</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="e.g., Difficulty scaling operations" value={newPainPoint} onChange={(e) => setNewPainPoint(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addToList("painPoints", newPainPoint, setNewPainPoint)} />
              <Button variant="outline" size="icon" onClick={() => addToList("painPoints", newPainPoint, setNewPainPoint)}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.painPoints.map(p => (
                <Badge key={p} variant="secondary" className="gap-1 pr-1">{p}
                  <button onClick={() => removeFromList("painPoints", p)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
            <Suggestions
              options={suggestions.painPoints}
              chosen={formData.painPoints}
              onAdd={(v) => addToList("painPoints", v, setNewPainPoint)}
            />
          </CardContent>
        </Card>

        {/* Buying Triggers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Zap className="w-4 h-4 text-primary" />Buying Triggers</CardTitle>
            <CardDescription>Events that signal buying readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="e.g., New funding round" value={newTrigger} onChange={(e) => setNewTrigger(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addToList("buyingTriggers", newTrigger, setNewTrigger)} />
              <Button variant="outline" size="icon" onClick={() => addToList("buyingTriggers", newTrigger, setNewTrigger)}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.buyingTriggers.map(t => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">{t}
                  <button onClick={() => removeFromList("buyingTriggers", t)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Globe className="w-4 h-4 text-primary" />Target Regions</CardTitle>
            <CardDescription>Geographic markets you want to target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {REGION_OPTIONS.map(region => (
                <Badge key={region} variant={formData.regions.includes(region) ? "default" : "outline"}
                  className="cursor-pointer transition-colors" onClick={() => toggleRegion(region)}>{region}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messaging Angles */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="w-4 h-4 text-primary" />Messaging Angles</CardTitle>
            <CardDescription>Key value propositions and messaging themes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="e.g., Cost reduction" value={newAngle} onChange={(e) => setNewAngle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addToList("messagingAngles", newAngle, setNewAngle)} />
              <Button variant="outline" size="icon" onClick={() => addToList("messagingAngles", newAngle, setNewAngle)}><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.messagingAngles.map(a => (
                <Badge key={a} variant="secondary" className="gap-1 pr-1">{a}
                  <button onClick={() => removeFromList("messagingAngles", a)} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Tone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Palette className="w-4 h-4 text-primary" />Content Tone</CardTitle>
            <CardDescription>Preferred tone for content and messaging</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={formData.contentTone || ""} onValueChange={(v) => setFormData(prev => ({ ...prev, contentTone: v }))}>
              <SelectTrigger><SelectValue placeholder="Select content tone" /></SelectTrigger>
              <SelectContent>
                {CONTENT_TONE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Notes</CardTitle>
            <CardDescription>Any other relevant information about your ICP</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Add any additional context..." value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))} rows={4} />
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col items-end gap-2 pb-6">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save ICP Profile
          </Button>
          <p className="text-xs text-muted-foreground text-right max-w-md">
            Save ICP Profile stores your ICP data for this campaign. It does not generate an ICP document.
          </p>
        </div>
      </div>
    </div>
  );
}
