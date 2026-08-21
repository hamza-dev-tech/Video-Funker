import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@product/components/ui/dropdown-menu";
import { Button } from "@product/components/ui/button";
import { useAuth } from "@product/hooks/useAuth";
import { useToast } from "@product/hooks/use-toast";

const UserMenu = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { error } = await signOut();

      if (error) {
        toast({
          variant: "destructive",
          title: "Couldn't sign you out",
          description: error.message,
        });
      } else {
        // No localStorage.clear() here either — signOut() has already removed
        // every key this app owns, and clear() would take the marketing site's
        // cookie-consent record with it. See the note in hooks/useAuth.ts.
        toast({
          title: "Signed out",
          description: "You have been successfully signed out.",
        });
        navigate("/auth", { replace: true });
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/20 text-primary">
            <User className="h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium text-foreground truncate">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          {isLoggingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
