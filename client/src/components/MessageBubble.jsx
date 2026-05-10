import React from 'react';
import Avatar from './Avatar';

const FileMessage = ({ url, messageId, type, fileName }) => {
  const handleFileDownload = async (event) => {
    event.preventDefault();

    // This download is handled by the backend route so the browser does not
    // directly download from Cloudinary. The backend can then stream the file
    // with the correct Content-Type and filename.
    const apiUrl = `/api/messages/download/${messageId}`;
    const token = localStorage.getItem('token');

    console.log('📥 Download request:', { fileName, apiUrl });

    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.warn('Download failed, opening backend URL:', error);
      window.open(apiUrl, '_blank', 'noopener noreferrer');
    }
  };

  if (type === 'image') {
    return (
      <div className="mt-2 relative rounded overflow-hidden border border-white/10 group max-w-sm">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={fileName || "Shared image"} className="w-full h-auto object-cover max-h-64 cursor-pointer group-hover:opacity-90 transition-opacity" loading="lazy" />
          <div className="absolute inset-0 bg-cyber-bg/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </a>
      </div>
    );
  }

  // Regular File
  return (
    <a 
      href={`/api/messages/download/${messageId}`}
      onClick={handleFileDownload}
      download={fileName}
      className="mt-2 flex items-center gap-3 p-3 bg-cyber-bg rounded border border-white/10 hover:border-cyber-cyan/50 hover:bg-white/5 transition-all w-fit max-w-full"
    >
      <div className="p-2 bg-cyber-card rounded text-cyber-cyan">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="overflow-hidden">
        <p className="text-sm text-white font-inter truncate w-48" title={fileName}>{fileName || "Download File"}</p>
        <p className="text-xs text-gray-500 font-inter mt-0.5">Click to view/download</p>
      </div>
    </a>
  );
};

const MessageBubble = ({ message, isOwnMessage }) => {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-cyber-bg/50 px-4 py-1.5 rounded-full border border-white/5">
          <span className="text-xs font-inter text-gray-400 italic">
            <span className="text-cyber-cyan/70">»</span> {message.content}
          </span>
        </div>
      </div>
    );
  }

  // Format timestamp (e.g., 14:30)
  const timeString = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex w-full mt-4 space-x-3 max-w-2xl ${isOwnMessage ? 'ml-auto justify-end' : ''}`}>
      {!isOwnMessage && (
        <div className="flex-shrink-0 mt-auto">
          <Avatar url={message.sender?.avatar} size="w-8 h-8" />
        </div>
      )}
      
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && (
          <span className="text-xs font-orbitron text-gray-400 mb-1 ml-1">
            {message.sender?.username}
          </span>
        )}
        
        <div 
          className={`relative px-4 py-3 rounded-2xl shadow-sm ${
            isOwnMessage 
              ? 'bg-cyber-cyan/10 border border-cyber-cyan/30 text-white rounded-br-sm' 
              : 'bg-cyber-card border border-white/10 text-white rounded-bl-sm'
          }`}
        >
          {message.content && (
            <p className="font-inter text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
          
          {message.type === 'file' && (
            <FileMessage
              url={message.fileUrl}
              messageId={message._id}
              type={message.fileType}
              fileName={message.fileName}
            />
          )}

          <div className={`text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <span>{timeString}</span>
            {isOwnMessage && (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-cyber-cyan/70" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
