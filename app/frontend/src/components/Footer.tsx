export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#1c3e18]/90 backdrop-blur-md border-t border-[#3DED97]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-12 flex items-center justify-between gap-4">
        <p className="text-[#F8F7F2]/40 text-xs">
          &copy; {year} Arrow. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-xs text-[#F8F7F2]/30">
          <span className="hover:text-[#F8F7F2]/60 cursor-pointer transition-colors">
            Privacy Policy
          </span>
          <span className="hover:text-[#F8F7F2]/60 cursor-pointer transition-colors">
            Terms of Service
          </span>
        </div>
      </div>
    </footer>
  );
}
