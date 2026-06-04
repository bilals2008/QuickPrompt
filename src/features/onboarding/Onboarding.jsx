import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { IconArrowRight, IconArrowLeft, IconRocket } from "@tabler/icons-react"
import OnboardingStep, { steps } from "./OnboardingStep"
import { cn } from "@/lib/utils"

export default function Onboarding() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  async function handleComplete() {
    await window.settingsAPI?.set("onboardingComplete", true)
    navigate("/")
  }

  function handleNext() {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  function handlePrev() {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  function handleSkip() {
    handleComplete()
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        <div className="flex-1 flex items-center justify-center py-12">
          <OnboardingStep stepIndex={currentStep} />
        </div>

        <div className="w-full px-6 pb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 cursor-pointer",
                  index === currentStep
                    ? "w-8 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="lg"
                className="flex-1 cursor-pointer"
                onClick={handlePrev}
              >
                <IconArrowLeft className="size-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              size="lg"
              className={cn("flex-1 cursor-pointer", isFirstStep && "w-full")}
              onClick={handleNext}
            >
              {isLastStep ? (
                <>
                  Get Started
                  <IconRocket className="size-4 ml-2" />
                </>
              ) : (
                <>
                  Next
                  <IconArrowRight className="size-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {!isLastStep && (
            <button
              onClick={handleSkip}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Skip intro
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
