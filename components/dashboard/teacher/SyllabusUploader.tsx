"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash, Save, Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { NIGERIAN_SUBJECTS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Schema for the form
const SyllabusFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  subject: z.string().min(2, "Subject is required"),
  classId: z.string().min(1, "Class is required"),
  term: z.string().min(1, "Term is required"),
  content: z.string().optional(),
  topics: z.array(z.object({
    name: z.string().min(2, "Topic name is required"),
    weightage: z.coerce.number().min(0).max(100),
  })).min(1, "At least one topic is required"),
});

type SyllabusFormValues = z.infer<typeof SyllabusFormSchema>;

export function SyllabusUploader() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SyllabusFormValues>({
    resolver: zodResolver(SyllabusFormSchema),
    defaultValues: {
      title: '',
      subject: '',
      classId: '',
      term: '1',
      content: '',
      topics: [{ name: '', weightage: 10 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "topics",
  });

  const selectedClass = form.watch('classId');
  const [customSubject, setCustomSubject] = useState(false);

  async function onSubmit(data: SyllabusFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/teacher/syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save syllabus');
      }

      toast.success('Syllabus saved successfully');
      form.reset();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save syllabus');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Syllabus</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Syllabus Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Mathematics Term 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subject</FormLabel>
                    {customSubject ? (
                       <div className="flex gap-2">
                        <Input placeholder="Enter custom subject" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setCustomSubject(false);
                            field.onChange('');
                          }}
                        >
                          Cancel
                        </Button>
                       </div>
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!selectedClass}
                            >
                              {field.value
                                ? field.value
                                : selectedClass
                                  ? "Select subject"
                                  : "Select class first"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search subject..." />
                            <CommandList>
                              <CommandEmpty>No subject found.</CommandEmpty>
                              <CommandGroup>
                                {(NIGERIAN_SUBJECTS[selectedClass] || []).map((subject) => (
                                  <CommandItem
                                    value={subject}
                                    key={subject}
                                    onSelect={() => {
                                      form.setValue("subject", subject);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        subject === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {subject}
                                  </CommandItem>
                                ))}
                                <CommandItem
                                  onSelect={() => {
                                    setCustomSubject(true);
                                    form.setValue("subject", "");
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Custom Subject
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Primary 1">Primary 1</SelectItem>
                        <SelectItem value="Primary 2">Primary 2</SelectItem>
                        <SelectItem value="Primary 3">Primary 3</SelectItem>
                        <SelectItem value="Primary 4">Primary 4</SelectItem>
                        <SelectItem value="Primary 5">Primary 5</SelectItem>
                        <SelectItem value="Primary 6">Primary 6</SelectItem>
                        <SelectItem value="JSS 1">JSS 1</SelectItem>
                        <SelectItem value="JSS 2">JSS 2</SelectItem>
                        <SelectItem value="JSS 3">JSS 3</SelectItem>
                        <SelectItem value="SS 1">SS 1</SelectItem>
                        <SelectItem value="SS 2">SS 2</SelectItem>
                        <SelectItem value="SS 3">SS 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Term" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Term 1</SelectItem>
                        <SelectItem value="2">Term 2</SelectItem>
                        <SelectItem value="3">Term 3</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Topics & Weightage (%)</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', weightage: 0 })}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-4 items-start">
                  <FormField
                    control={form.control}
                    name={`topics.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="Topic Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`topics.${index}.weightage`}
                    render={({ field }) => (
                      <FormItem className="w-24">
                        <FormControl>
                          <Input type="number" placeholder="%" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes/Content (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any specific learning objectives or notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Syllabus
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
