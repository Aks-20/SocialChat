import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  FileText, 
  Image, 
  Video, 
  Smile, 
  Calendar, 
  MapPin, 
  Users,
  Zap
} from "lucide-react";

interface CreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: () => void;
  onCreateStory: () => void;
  onCreateEvent?: () => void;
  onCreateRoom?: () => void;
}

export default function CreateDropdown({ 
  isOpen, 
  onClose, 
  onCreatePost, 
  onCreateStory,
  onCreateEvent,
  onCreateRoom
}: CreateDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const createOptions = [
    {
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      title: "Create Post",
      description: "Share your thoughts with your followers",
      onClick: onCreatePost
    },
    {
      icon: <Zap className="h-5 w-5 text-purple-500" />,
      title: "Create Story",
      description: "Share a moment that disappears after 24 hours",
      onClick: onCreateStory
    },
    {
      icon: <Video className="h-5 w-5 text-red-500" />,
      title: "Go Live",
      description: "Broadcast live video to your followers",
      onClick: () => console.log("Go Live clicked")
    },
    {
      icon: <Image className="h-5 w-5 text-green-500" />,
      title: "Photo/Video",
      description: "Upload photos or videos to share",
      onClick: onCreatePost
    },
    {
      icon: <Calendar className="h-5 w-5 text-orange-500" />,
      title: "Event",
      description: "Create and invite people to an event",
      onClick: onCreateEvent || (() => {
        const event = new CustomEvent('openCreateEvent');
        window.dispatchEvent(event);
      })
    },
    {
      icon: <Users className="h-5 w-5 text-teal-500" />,
      title: "Room",
      description: "Start a conversation room",
      onClick: onCreateRoom || (() => {
        const event = new CustomEvent('openCreateRoom');
        window.dispatchEvent(event);
      })
    }
  ];

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Create</h3>
        <div className="space-y-2">
          {createOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
            >
              <div className="mr-3">
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {option.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {option.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}