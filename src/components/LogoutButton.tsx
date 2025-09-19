import { Button } from "./ui/button";

export default function LogoutButton() {
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    window.dispatchEvent(new Event("auth:logout"));
  };

  return (
    <Button
      size="sm"
      className="bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 shadow-xs flex items-center justify-center min-w-[96px]"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}
