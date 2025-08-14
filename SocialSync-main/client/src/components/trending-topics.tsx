import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Hash, Users, Clock } from "lucide-react";

interface TrendingTopic {
  id: number;
  hashtag: string;
  posts: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

// Mock data for demonstration - in real app, this would come from API
const mockTrendingTopics: TrendingTopic[] = [
  { id: 1, hashtag: "TechNews", posts: 1247, trend: 'up', change: 12 },
  { id: 2, hashtag: "SocialMedia", posts: 856, trend: 'up', change: 8 },
  { id: 3, hashtag: "AI", posts: 723, trend: 'down', change: -3 },
  { id: 4, hashtag: "Photography", posts: 612, trend: 'up', change: 15 },
  { id: 5, hashtag: "Travel", posts: 489, trend: 'stable', change: 0 },
  { id: 6, hashtag: "Food", posts: 334, trend: 'up', change: 5 },
];

export default function TrendingTopics() {
  const [timeFrame, setTimeFrame] = useState<'1h' | '24h' | '7d'>('24h');

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-500";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Trending Now</h3>
          </div>
          <div className="flex space-x-1">
            {(['1h', '24h', '7d'] as const).map((period) => (
              <Button
                key={period}
                variant={timeFrame === period ? "default" : "ghost"}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setTimeFrame(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {mockTrendingTopics.map((topic, index) => (
            <div key={topic.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-muted-foreground w-4">
                  {index + 1}
                </span>
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">{topic.hashtag}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{topic.posts.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(topic.trend)}
                  <span className={`text-xs ${getChangeColor(topic.change)}`}>
                    {topic.change > 0 ? '+' : ''}{topic.change}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-3 text-sm">
          Show more trends
        </Button>
      </CardContent>
    </Card>
  );
}