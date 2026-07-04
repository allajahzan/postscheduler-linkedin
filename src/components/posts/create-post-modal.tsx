import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AppInputField,
  AppTextareaField,
  SubmitButton,
} from "@/components/ui/form-fields";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePost } from "@/hooks/use-posts";
import { useEffect } from "react";
import { Info, Sparkles } from "lucide-react";

const postSchema = z.object({
  title: z.string().min(3, "Title is required (min 3 chars)"),
  description: z.string().min(5, "Description is required (min 5 chars)"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  image_url: z.string().optional(),
  generate_image: z.boolean(),
  prompt: z.string().optional(),
});

type PostFormValues = z.infer<typeof postSchema>;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const createPost = useCreatePost();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      generate_image: false,
    },
  });

  const imageUrl = watch("image_url");
  const generateImage = watch("generate_image");

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = (data: PostFormValues) => {
    createPost.mutate(data, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-[#0B1120]/50 backdrop-blur-xl">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <DialogHeader className="p-5 border-b gap-1">
            <DialogTitle>Schedule a Post</DialogTitle>
            <DialogDescription>
              Fill in your idea — AI polishes the rest.
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Body */}
          <div className="p-5 overflow-y-auto space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <AppInputField
                label="Post Date"
                type="date"
                error={errors.date}
                {...register("date")}
              />
              <AppInputField
                label="Post Time (IST)"
                type="time"
                error={errors.time}
                {...register("time")}
              />
            </div>

            <AppInputField
              label="Post Title"
              placeholder="Give a title for your post"
              error={errors.title}
              {...register("title")}
            />

            <AppTextareaField
              label="Post Description"
              placeholder="Give a description for your post"
              className="min-h-[120px]"
              error={errors.description}
              {...register("description")}
            />

            <AppTextareaField
              label="AI Prompt"
              optional
              placeholder="Add specific instructions for AI to polish your title and description..."
              className="min-h-[120px]"
              error={errors.prompt}
              {...register("prompt")}
            />

            <AppInputField
              label="Image URL"
              optional
              placeholder="Paste a Public Google Drive Image Link or Direct Image URL"
              className="disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={generateImage}
              error={errors.image_url}
              {...register("image_url")}
            />

            {/* AI Generate Toggle Card */}
            <p className="text-xs flex items-center gap-2">
              <Info size={14} />
              <span>
                If you don't have an image, AI will generate one for you when
                enabled.
              </span>
            </p>
            <div
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${generateImage ? "border-primary/50 bg-primary/5" : "border-border bg-[#111827]/50"}`}
            >
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary shadow-inner">
                  <Sparkles className="size-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Generate Image with AI
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ai will design a matching visual for your post
                  </p>
                </div>
              </div>
              <Switch
                checked={generateImage}
                onCheckedChange={(val) => setValue("generate_image", val)}
                disabled={!!imageUrl}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t sticky bottom-0 shrink-0 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <SubmitButton
              isPending={createPost.isPending}
              loadingText="Scheduling..."
            >
              Schedule Post
            </SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
