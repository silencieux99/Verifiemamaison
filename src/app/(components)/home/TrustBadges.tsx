'use client';

const StarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.24-.662 1.561 0l1.672 3.434a.75.75 0 00.564.41l3.793.55a.75.75 0 01.416 1.28l-2.744 2.674a.75.75 0 00-.215.664l.647 3.777a.75.75 0 01-1.088.791l-3.393-1.783a.75.75 0 00-.702 0l-3.393 1.783a.75.75 0 01-1.088-.79l.647-3.778a.75.75 0 00-.215-.664L2.94 8.578a.75.75 0 01.416-1.28l3.793-.55a.75.75 0 00.564-.41l1.672-3.434z" clipRule="evenodd" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
        <path fill="#ffc107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.951 3.049l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
        <path fill="#ff3d00" d="M6.306 14.691l6.571 4.819C14.39 16.146 18.88 12 24 12c3.059 0 5.842 1.154 7.951 3.049l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
        <path fill="#4caf50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.281-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
        <path fill="#1976d2" d="M43.611 20.083L43.595 20H24v8h11.303a11.8 11.8 0 0 1-5.238 7.592l6.19 5.238C41.018 37.31 44 31.08 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
);

const TrustpilotIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    className={props.className}
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    {...props}
  >
    <path d="M12 2l2.39 6.96h7.31l-5.92 4.3 2.26 6.98L12 16.9l-6.04 3.34 2.26-6.98-5.92-4.3h7.31z" />
  </svg>
);

export default function TrustBadges() {
  return (
    <div 
      className="my-6 sm:my-8 animate-fadeInUp flex justify-center" 
      style={{ animationDelay: '0.4s' }}
    >
      <div className="w-full max-w-md sm:max-w-none sm:inline-flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-full p-4 sm:p-2 border border-purple-200 shadow-lg shadow-purple-500/10">
        
        {/* Google Badge */}
        <div className="flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-4 py-2 sm:py-1 w-full sm:w-auto">
          <div className="flex items-center justify-center shrink-0">
            <GoogleIcon className="w-7 h-7 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col items-start justify-center">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              <span className="font-semibold text-gray-900">4.9/5</span> sur Google
            </p>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-full sm:w-px h-px sm:h-8 sm:min-h-[32px] bg-purple-200"></div>

        {/* Trustpilot Badge */}
        <div className="flex items-center justify-center sm:justify-start gap-3 px-2 sm:px-4 py-2 sm:py-1 w-full sm:w-auto">
          <div className="flex items-center justify-center shrink-0">
            <TrustpilotIcon className="w-7 h-7 sm:w-6 sm:h-6 text-[#00b67a]" />
          </div>
          <div className="flex flex-col items-start justify-center">
             <div className="flex items-center gap-0.5">
               {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              <span className="font-semibold text-gray-900">Excellent</span> sur Trustpilot
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
