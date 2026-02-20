"use client";

import { useState } from "react";

type ApiResponse = {
  row?: Record<string, unknown> | null;
  error?: string;
};

export default function CaptionVoteForm({ caption }) {
  return (
    <div className="border p-4 rounded-lg">
      {/* Display the Image */}
      <img 
        src={caption.images.image_url} 
        alt="Humor Image" 
        className="w-full h-auto rounded" 
      />
      
      {/* Display the Caption Text */}
      <p className="my-4 italic text-lg">"{caption.caption_text}"</p>

      {/* Simplified Voting Form */}
      <form action="/api/caption-votes" method="POST" className="flex gap-4">
        {/* Hidden input to pass the ID automatically */}
        <input type="hidden" name="captionId" value={caption.id} />
        
        {/* Upvote Button */}
        <button 
          name="score" 
          value="1" 
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          👍 Upvote
        </button>

        {/* Downvote Button */}
        <button 
          name="score" 
          value="-1" 
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          👎 Downvote
        </button>
      </form>
    </div>
  );
}
