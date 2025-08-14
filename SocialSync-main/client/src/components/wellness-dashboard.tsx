import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Moon, 
  Zap, 
  Brain, 
  Droplets, 
  Activity, 
  Plus, 
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WellnessRecord {
  id: number;
  userId: number;
  date: string;
  moodRating: number | null;
  energyLevel: number | null;
  stressLevel: number | null;
  sleepHours: number | null;
  waterIntake: number | null;
  exerciseMinutes: number | null;
  notes: string | null;
  isPrivate: boolean;
}

interface Habit {
  id: number;
  userId: number;
  name: string;
  description: string | null;
  frequency: string;
  category: string | null;
  targetValue: number | null;
  unit: string | null;
  isActive: boolean;
  streakCount: number;
  createdAt: string;
}

interface HabitLog {
  id: number;
  habitId: number;
  userId: number;
  date: string;
  completed: boolean;
  value: number | null;
  notes: string | null;
}

export function WellnessDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showWellnessDialog, setShowWellnessDialog] = useState(false);
  const [showHabitDialog, setShowHabitDialog] = useState(false);
  const [wellnessForm, setWellnessForm] = useState({
    moodRating: [3],
    energyLevel: [3],
    stressLevel: [3],
    sleepHours: "",
    waterIntake: "",
    exerciseMinutes: "",
    notes: "",
  });
  const [habitForm, setHabitForm] = useState({
    name: "",
    description: "",
    category: "wellness",
    frequency: "daily",
    targetValue: "",
    unit: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch wellness data
  const { data: wellnessData = [], isLoading: loadingWellness } = useQuery({
    queryKey: ["/api/wellness-tracking"],
  });

  const { data: habits = [], isLoading: loadingHabits } = useQuery({
    queryKey: ["/api/habits"],
  });

  const { data: habitLogs = [] } = useQuery({
    queryKey: ["/api/habit-logs", selectedDate],
  });

  // Get today's wellness record
  const todayRecord = wellnessData.find((record: WellnessRecord) => 
    record.date.split('T')[0] === selectedDate
  );

  // Calculate wellness insights
  const getWellnessInsights = () => {
    if (wellnessData.length === 0) return null;
    
    const last7Days = wellnessData.slice(0, 7);
    const avgMood = last7Days.reduce((sum, record) => sum + (record.moodRating || 0), 0) / last7Days.length;
    const avgEnergy = last7Days.reduce((sum, record) => sum + (record.energyLevel || 0), 0) / last7Days.length;
    const avgStress = last7Days.reduce((sum, record) => sum + (record.stressLevel || 0), 0) / last7Days.length;
    const avgSleep = last7Days.reduce((sum, record) => sum + (record.sleepHours || 0), 0) / last7Days.length;

    return {
      avgMood: Math.round(avgMood * 10) / 10,
      avgEnergy: Math.round(avgEnergy * 10) / 10,
      avgStress: Math.round(avgStress * 10) / 10,
      avgSleep: Math.round(avgSleep * 10) / 10,
    };
  };

  const insights = getWellnessInsights();

  // Mutations
  const recordWellnessMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        date: selectedDate,
        moodRating: data.moodRating[0],
        energyLevel: data.energyLevel[0],
        stressLevel: data.stressLevel[0],
        sleepHours: data.sleepHours ? parseInt(data.sleepHours) : null,
        waterIntake: data.waterIntake ? parseInt(data.waterIntake) : null,
        exerciseMinutes: data.exerciseMinutes ? parseInt(data.exerciseMinutes) : null,
        notes: data.notes || null,
        isPrivate: true,
      };
      
      console.log("Sending wellness data:", payload);
      
      const response = await fetch("/api/wellness-tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to record wellness data");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Wellness logged",
        description: "Your wellness data has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/wellness-tracking"] });
      setShowWellnessDialog(false);
      resetWellnessForm();
    },
    onError: (error: any) => {
      console.error("Wellness tracking error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to record wellness data",
        variant: "destructive",
      });
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/habits", {
        name: data.name,
        description: data.description || null,
        category: data.category,
        frequency: data.frequency,
        targetValue: data.targetValue ? parseInt(data.targetValue) : null,
        unit: data.unit || null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Habit created",
        description: "Your new habit has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setShowHabitDialog(false);
      resetHabitForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create habit",
        variant: "destructive",
      });
    },
  });

  const markHabitMutation = useMutation({
    mutationFn: async (data: { habitId: number; completed: boolean; date: string }) => {
      return apiRequest("POST", "/api/habit-logs", {
        habitId: data.habitId,
        date: data.date,
        completed: data.completed,
        value: null,
        notes: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habit-logs", selectedDate] });
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] }); // Refresh habits to get updated streak counts
      toast({
        title: "Habit updated",
        description: "Habit completion status and streak have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update habit",
        variant: "destructive",
      });
    },
  });

  const resetWellnessForm = () => {
    setWellnessForm({
      moodRating: [3],
      energyLevel: [3],
      stressLevel: [3],
      sleepHours: "",
      waterIntake: "",
      exerciseMinutes: "",
      notes: "",
    });
  };

  const resetHabitForm = () => {
    setHabitForm({
      name: "",
      description: "",
      category: "wellness",
      frequency: "daily",
      targetValue: "",
      unit: "",
    });
  };

  const handleWellnessSubmit = () => {
    recordWellnessMutation.mutate(wellnessForm);
  };

  const handleHabitSubmit = () => {
    if (!habitForm.name.trim()) {
      toast({
        title: "Error",
        description: "Habit name is required",
        variant: "destructive",
      });
      return;
    }
    createHabitMutation.mutate(habitForm);
  };

  const isHabitCompletedForDate = (habitId: number, date: string) => {
    const log = habitLogs.find((log: HabitLog) => 
      log.habitId === habitId && log.date.split('T')[0] === date
    );
    return log?.completed || false;
  };

  const getHabitStreak = (habitId: number) => {
    // Get the streak count from the habit data
    const habit = habits.find((h: Habit) => h.id === habitId);
    return habit?.streakCount || 0;
  };

  const toggleHabitCompletion = (habitId: number) => {
    const isCompleted = isHabitCompletedForDate(habitId, selectedDate);
    markHabitMutation.mutate({
      habitId,
      completed: !isCompleted,
      date: selectedDate,
    });
  };

  const getMoodEmoji = (rating: number) => {
    const emojis = ["😢", "😟", "😐", "😊", "😄"];
    return emojis[rating - 1] || "😐";
  };

  const getStressColor = (level: number) => {
    const colors = ["bg-green-500", "bg-yellow-400", "bg-orange-400", "bg-red-400", "bg-red-600"];
    return colors[level - 1] || "bg-gray-400";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-pink-500" />
          <h1 className="text-2xl font-bold">Wellness Dashboard</h1>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Dialog open={showWellnessDialog} onOpenChange={setShowWellnessDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Log Wellness
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Today's Wellness */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Wellness - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              {todayRecord ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{getMoodEmoji(todayRecord.moodRating || 3)}</div>
                    <p className="text-sm text-gray-500">Mood</p>
                    <p className="font-semibold">{todayRecord.moodRating || "Not logged"}/5</p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm text-gray-500">Energy</p>
                    <p className="font-semibold">{todayRecord.energyLevel || "Not logged"}/5</p>
                  </div>
                  <div className="text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-gray-500">Stress</p>
                    <p className="font-semibold">{todayRecord.stressLevel || "Not logged"}/5</p>
                  </div>
                  <div className="text-center">
                    <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-gray-500">Sleep</p>
                    <p className="font-semibold">{todayRecord.sleepHours || "Not logged"}h</p>
                  </div>
                  <div className="text-center">
                    <Droplets className="h-8 w-8 mx-auto mb-2 text-cyan-500" />
                    <p className="text-sm text-gray-500">Water</p>
                    <p className="font-semibold">{todayRecord.waterIntake || "Not logged"} glasses</p>
                  </div>
                  <div className="text-center">
                    <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm text-gray-500">Exercise</p>
                    <p className="font-semibold">{todayRecord.exerciseMinutes || "Not logged"} min</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No wellness data logged for this date</p>
                  <Button onClick={() => setShowWellnessDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Your Wellness
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Habits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Today's Habits
                <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Habit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Habit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Habit creation functionality coming soon!
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No habits created yet</p>
              ) : (
                <div className="space-y-3">
                  {habits.slice(0, 5).map((habit: Habit) => {
                    const isCompleted = isHabitCompletedForDate(habit.id, selectedDate);
                    const streak = getHabitStreak(habit.id);
                    
                    return (
                      <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                          <div>
                            <h4 className="font-medium">{habit.name}</h4>
                            <p className="text-sm text-gray-500">{habit.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {streak} day streak
                          </Badge>
                          <Button 
                            size="sm" 
                            variant={isCompleted ? "default" : "outline"}
                            onClick={() => toggleHabitCompletion(habit.id)}
                            disabled={markHabitMutation.isPending}
                          >
                            {isCompleted ? "Completed" : "Mark Done"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="habits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Your Habits
                <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Habit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Habit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Habit creation functionality coming soon!
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHabits ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-20"></div>
                    </div>
                  ))}
                </div>
              ) : habits.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">Start building healthy habits</p>
                  <Button onClick={() => setShowHabitDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Habit
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {habits.map((habit: Habit) => (
                    <Card key={habit.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Target className="h-5 w-5 text-blue-500" />
                            <div>
                              <h3 className="font-semibold">{habit.name}</h3>
                              <p className="text-sm text-gray-500">{habit.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{habit.frequency}</Badge>
                                <Badge variant="outline">{habit.category}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {habit.streakCount}
                          </div>
                          <p className="text-sm text-gray-500">day streak</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insights ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{getMoodEmoji(Math.round(insights.avgMood))}</div>
                    <p className="text-sm text-gray-500">Avg Mood</p>
                    <p className="font-semibold">{insights.avgMood}/5</p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                    <p className="text-sm text-gray-500">Avg Energy</p>
                    <p className="font-semibold">{insights.avgEnergy}/5</p>
                  </div>
                  <div className="text-center">
                    <Brain className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-sm text-gray-500">Avg Stress</p>
                    <p className="font-semibold">{insights.avgStress}/5</p>
                  </div>
                  <div className="text-center">
                    <Moon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-sm text-gray-500">Avg Sleep</p>
                    <p className="font-semibold">{insights.avgSleep}h</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Start logging your wellness data to see insights
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wellness History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWellness ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-16"></div>
                    </div>
                  ))}
                </div>
              ) : wellnessData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No wellness data recorded yet</p>
              ) : (
                <div className="space-y-4">
                  {wellnessData.map((record: WellnessRecord) => (
                    <Card key={record.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <h4 className="font-medium">
                              {new Date(record.date).toLocaleDateString()}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm">
                                Mood: {getMoodEmoji(record.moodRating || 3)} {record.moodRating}/5
                              </span>
                              <span className="text-sm">Energy: {record.energyLevel}/5</span>
                              <span className="text-sm">Sleep: {record.sleepHours}h</span>
                            </div>
                          </div>
                        </div>
                        {record.notes && (
                          <div className="text-sm text-gray-500 max-w-xs">
                            "{record.notes}"
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Wellness Logging Dialog */}
      <Dialog open={showWellnessDialog} onOpenChange={setShowWellnessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Wellness for {new Date(selectedDate).toLocaleDateString()}</DialogTitle>
          </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4" />
                Mood Rating
              </Label>
              <Slider
                value={wellnessForm.moodRating}
                onValueChange={(value) => setWellnessForm(prev => ({ ...prev, moodRating: value }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>😢 Very Sad</span>
                <span>😄 Very Happy</span>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                Energy Level
              </Label>
              <Slider
                value={wellnessForm.energyLevel}
                onValueChange={(value) => setWellnessForm(prev => ({ ...prev, energyLevel: value }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4" />
                Stress Level
              </Label>
              <Slider
                value={wellnessForm.stressLevel}
                onValueChange={(value) => setWellnessForm(prev => ({ ...prev, stressLevel: value }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>No Stress</span>
                <span>Very Stressed</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sleep">Sleep Hours</Label>
                <Input
                  id="sleep"
                  type="number"
                  placeholder="8"
                  value={wellnessForm.sleepHours}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, sleepHours: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="water">Water (glasses)</Label>
                <Input
                  id="water"
                  type="number"
                  placeholder="8"
                  value={wellnessForm.waterIntake}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, waterIntake: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="exercise">Exercise (minutes)</Label>
                <Input
                  id="exercise"
                  type="number"
                  placeholder="30"
                  value={wellnessForm.exerciseMinutes}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, exerciseMinutes: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How was your day? Any thoughts or reflections..."
                value={wellnessForm.notes}
                onChange={(e) => setWellnessForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowWellnessDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleWellnessSubmit} disabled={recordWellnessMutation.isPending}>
              {recordWellnessMutation.isPending ? "Saving..." : "Save Wellness"}
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Create Habit Dialog */}
      <Dialog open={showHabitDialog} onOpenChange={setShowHabitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="habitName">Habit Name</Label>
              <Input
                id="habitName"
                placeholder="e.g., Drink 8 glasses of water"
                value={habitForm.name}
                onChange={(e) => setHabitForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="habitDescription">Description (optional)</Label>
              <Textarea
                id="habitDescription"
                placeholder="Why is this habit important to you?"
                value={habitForm.description}
                onChange={(e) => setHabitForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded-md"
                  value={habitForm.category}
                  onChange={(e) => setHabitForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="wellness">Wellness</option>
                  <option value="fitness">Fitness</option>
                  <option value="beauty">Beauty</option>
                  <option value="career">Career</option>
                  <option value="mindfulness">Mindfulness</option>
                </select>
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  className="w-full p-2 border rounded-md"
                  value={habitForm.frequency}
                  onChange={(e) => setHabitForm(prev => ({ ...prev, frequency: e.target.value }))}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetValue">Target (optional)</Label>
                <Input
                  id="targetValue"
                  type="number"
                  placeholder="8"
                  value={habitForm.targetValue}
                  onChange={(e) => setHabitForm(prev => ({ ...prev, targetValue: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input
                  id="unit"
                  placeholder="glasses, minutes, pages"
                  value={habitForm.unit}
                  onChange={(e) => setHabitForm(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowHabitDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleHabitSubmit} disabled={createHabitMutation.isPending}>
                {createHabitMutation.isPending ? "Creating..." : "Create Habit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}