import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Plus,
  User,
  CalendarDays
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import CreateEventModal from "@/components/create-event-modal";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  startDate: string;
  maxAttendees: number | null;
  currentAttendees: number;
  creatorId: number;
  createdAt: string;
  creator: {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
  };
  attendeeStatus: string;
  attendeeCount: number;
}

export default function EventsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString();
    
    if (isToday) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  const getEventStatus = (startDate: string) => {
    const eventDate = new Date(startDate);
    const now = new Date();
    
    if (eventDate < now) {
      return { status: 'past', color: 'bg-gray-100 text-gray-800' };
    } else if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: 'upcoming', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { status: 'future', color: 'bg-blue-100 text-blue-800' };
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-8 w-8 text-purple-500" />
          <div>
            <h1 className="text-3xl font-bold">Events</h1>
            <p className="text-gray-600">Discover and create events in your community</p>
          </div>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card className="p-8 text-center">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold mb-2">No Events Yet</h3>
          <p className="text-gray-600 mb-4">
            Be the first to create an event and bring your community together.
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Event
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6">
          {events.map((event: Event) => {
            const eventStatus = getEventStatus(event.startDate);
            
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <Badge className={eventStatus.color}>
                          {eventStatus.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatEventDate(event.startDate)}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.currentAttendees} attending
                          {event.maxAttendees && ` / ${event.maxAttendees} max`}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {event.description && (
                    <p className="text-gray-700">{event.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={event.creator.avatar || undefined} />
                        <AvatarFallback>
                          {event.creator.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <span className="text-gray-500">Created by </span>
                        <span className="font-medium">{event.creator.name}</span>
                        <span className="text-gray-500">
                          {' · ' + formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {eventStatus.status !== 'past' && (
                        <Button size="sm">
                          <User className="w-4 h-4 mr-1" />
                          Join Event
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateEventModal 
        isOpen={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false);
          queryClient.invalidateQueries({ queryKey: ["/api/events"] });
        }} 
      />
    </div>
  );
}