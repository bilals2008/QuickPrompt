// File: src/features/onboarding/OnboardingStep.jsx
import { IconDeviceDesktop, IconCopy, IconCommand, IconArrowsTransferUpDown } from "@tabler/icons-react"

const steps = [
  {
    id: 1,
    title: "Welcome to QuickPrompt",
    description: "Your personal prompt manager. Create, organize, and access your prompts instantly.",
    icon: IconDeviceDesktop,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    id: 2,
    title: "Create, Tag & Copy",
    description: "Save prompts with custom tags and copy them in one click. Use anywhere - ChatGPT, Claude, or any AI tool.",
    icon: IconCopy,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: 3,
    title: "Spotlight Search",
    description: "Press ⌘ + K (or Ctrl + K) anywhere to instantly search and open any prompt with Spotlight.",
    icon: IconCommand,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  {
    id: 4,
    title: "Import & Export",
    description: "Back up your prompts anytime, or migrate from another tool. Your data is always yours.",
    icon: IconArrowsTransferUpDown,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
  },
]

export default function OnboardingStep({ stepIndex }) {
  const step = steps[stepIndex]
  const Icon = step.icon

  return (
    <div className="flex flex-col items-center justify-center text-center px-6">
      <div className={`flex items-center justify-center w-20 h-20 rounded-2xl ${step.bgColor} mb-6`}>
        <Icon className={`size-10 ${step.color}`} />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        {step.title}
      </h2>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
        {step.description}
      </p>
    </div>
  )
}

export { steps }
