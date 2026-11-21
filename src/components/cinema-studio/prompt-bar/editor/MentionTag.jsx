export function MentionTag({ imageUrl, imageIndex: _imageIndex, imageName, onClick, onRemove }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
      return;
    }
    onRemove?.();
  };

  return (
    <span 
      contentEditable={false} 
      draggable 
      onClick={handleClick}
      data-feature-chip={onClick ? "true" : undefined}
      className="cursor-pointer group select-none inline-block mx-[2px] transition-all"
    >
      <span className="inline-flex align-middle items-center gap-1 rounded-md bg-surface-tonal overflow-hidden border border-border-subtle px-0.5 group-hover:border-border-heavy group-hover:bg-surface-tonal-hover transition-all">
        
        {/* Thumbnail */}
        <figure className="relative overflow-hidden bg-white-5 size-[18px] flex-shrink-0 rounded">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`preview of ${imageName}`}
              className="object-cover absolute inset-0 size-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary">
              <svg viewBox="0 0 24 24" width="10" height="10" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3"
                  stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="8.5" cy="8.5" r="1.5"
                  stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 16l5-5 4 4 3-3 6 6"
                  stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
        </figure>

        {/* Label */}
        <span className="truncate max-w-[80px] ds-text-caption-m font-medium text-text-primary pr-1 leading-none">
          {imageName}
        </span>

      </span>
    </span>
  );
}
