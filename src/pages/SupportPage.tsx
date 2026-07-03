import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { submitReport } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MessageSquare, Bug, LifeBuoy } from "lucide-react";

export default function SupportPage() {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertReportSchema),
    defaultValues: {
      type: "feedback",
      subject: "",
      description: "",
      pageSection: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => submitReport(data),
    onSuccess: () => {
      toast({ title: "Report Submitted", description: "Your request has been received and will be reviewed shortly." });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error: Error) => {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    },
  });

  const description = form.watch("description") || "";

  return (
    <div className="container max-w-2xl py-12">
      <Card className="border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <LifeBuoy className="text-primary" size={24} />
          </div>
          <CardTitle className="text-2xl font-bold">Support & Feedback</CardTitle>
          <CardDescription>
            Encountered a bug or have an idea to improve the platform? Let us know below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="feedback">
                            <div className="flex items-center gap-2">
                              <MessageSquare size={14} className="text-blue-500" />
                              <span>Feedback</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="bug">
                            <div className="flex items-center gap-2">
                              <Bug size={14} className="text-red-500" />
                              <span>Bug Report</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="support">
                            <div className="flex items-center gap-2">
                              <LifeBuoy size={14} className="text-green-500" />
                              <span>Support Request</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pageSection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page/Section (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Chat Page, Profile Settings" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input placeholder="Short summary of the issue" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Detailed Description</FormLabel>
                      <span className={`text-xs ${description.length > 450 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {description.length} / 500
                      </span>
                    </div>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe your issue or suggestion as clearly as possible..." 
                        className="min-h-[150px] resize-none"
                        {...field} 
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
