"use client";

import { automatedTriage, AutomatedTriageOutput } from "@/ai/flows/automated-triage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { FlaskConical, Lightbulb, ListChecks, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const triageFormSchema = z.object({
  medicalHistory: z.string().min(20, {
    message: "Medical history must be at least 20 characters.",
  }),
});

export default function AutomatedTriagePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AutomatedTriageOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof triageFormSchema>>({
    resolver: zodResolver(triageFormSchema),
    defaultValues: {
      medicalHistory: "",
    },
  });

  async function onSubmit(values: z.infer<typeof triageFormSchema>) {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await automatedTriage(values);
      setResult(response);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Triage Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Automated Triage</CardTitle>
          <CardDescription>
            Enter the patient's medical history to receive an AI-powered triage assessment, including likely conditions, suggested questions, and potential treatments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Medical History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., '6-year-old male Golden Retriever, history of seasonal allergies. Presents with lethargy, loss of appetite, and occasional vomiting for the past 48 hours...'"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  "Analyzing..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Triage
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isLoading && <TriageSkeleton />}
      
      {result && (
        <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-center gap-4">
                    <Lightbulb className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Likely Condition</CardTitle>
                        <CardDescription>AI-suggested diagnosis</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold text-lg">{result.likelyCondition}</p>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center gap-4">
                    <ListChecks className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Triage Questions</CardTitle>
                        <CardDescription>Suggested questions to ask</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 list-disc pl-5">
                    {result.triageQuestions.map((q, index) => (
                        <li key={index}>{q}</li>
                    ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-row items-center gap-4">
                    <FlaskConical className="w-8 h-8 text-primary" />
                    <div>
                        <CardTitle>Suggested Treatments</CardTitle>
                        <CardDescription>Potential treatment options to consider</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 list-disc pl-5">
                    {result.suggestedTreatments.map((t, index) => (
                        <li key={index}>{t}</li>
                    ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

const TriageSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-5 w-1/2" /></CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </CardContent>
        </Card>
  </div>
);
