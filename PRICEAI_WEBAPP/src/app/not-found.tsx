import { Button } from "@/components/ui/Button";
;

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-priceai-blue to-priceai-lightgreen animate-fade-in">
      <div className="bg-white/90 p-10 rounded-priceai shadow-glass w-full max-w-md flex flex-col items-center border border-priceai-blue">
        <svg className="w-20 h-20 mb-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="22" fill="#FF5D5D" fillOpacity="0.15" />
          <path fill="#FF5D5D" d="M24 14a2 2 0 0 1 2 2v8a2 2 0 0 1-4 0v-8a2 2 0 0 1 2-2zm0 20a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/>
        </svg>
        <h1 className="text-3xl font-extrabold text-priceai-dark mb-2">Page Not Found</h1>
        <div className="text-priceai-gray text-center mb-6">Sorry, the page you are looking for does not exist or has been moved.</div>
        <a href="/" className="w-full">
          <Button className="w-full justify-center text-base">
            Go Home
          </Button>
        </a>
        <div className="mt-8 text-xs text-priceai-gray text-center">
          If you believe this is an error, please contact <span className="underline cursor-pointer hover:text-priceai-blue">support</span>.
        </div>
      </div>
    </div>
  );
}
