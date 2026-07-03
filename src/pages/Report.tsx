import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MessageSquare, Bug, LifeBuoy, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";

export default function Report() {
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
    mutationFn: (data: any) => api.submitReport(data),
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
    <div className="min-h-screen abstract-bg font-sans pb-20">
      <Navbar />
      
      <div className="container max-w-2xl pt-32 px-4 relative">
        <Link href="/">
          <Button
            variant="ghost"
            className="absolute top-36 -left-12 rounded-full w-10 h-10 p-0 hidden md:flex"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-panel border-border shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="text-center pt-8">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <LifeBuoy className="text-primary" size={32} />
              </div>
              <CardTitle className="text-3xl font-display font-black">Support & Feedback</CardTitle>
              <CardDescription className="text-lg font-medium">
                Help us improve. Submit your bugs, feedback, or support requests here.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-bold">Issue Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-muted/40 h-12 rounded-xl border-border">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="glass-panel border-border">
                              <SelectItem value="feedback">
                                <div className="flex items-center gap-2">
                                  <MessageSquare size={16} className="text-blue-500" />
                                  <span className="font-semibold">Feedback</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="bug">
                                <div className="flex items-center gap-2">
                                  <Bug size={16} className="text-red-500" />
                                  <span className="font-semibold">Bug Report</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="support">
                                <div className="flex items-center gap-2">
                                  <LifeBuoy size={16} className="text-green-500" />
                                  <span className="font-semibold">Support Request</span>
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
                          <FormLabel className="font-bold">Page or Section</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. Chat Page, Events tab" 
                              className="bg-muted/40 h-12 rounded-xl border-border" 
                              {...field} 
                              value={field.value || ""} 
                            />
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
                        <FormLabel className="font-bold">Subject</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Short & concise subject line" 
                            className="bg-muted/40 h-12 rounded-xl border-border" 
                            {...field} 
                          />
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
                        <div className="flex justify-between items-center px-1">
                          <FormLabel className="font-bold">Details</FormLabel>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${description.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {description.length} / 500 characters
                          </span>
                        </div>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the issue or type of problem you faced..." 
                            className="bg-muted/40 min-h-[160px] rounded-2xl resize-none border-border focus:bg-muted/60 transition-colors"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    size="lg"
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]" 
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Submit Report
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

