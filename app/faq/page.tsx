import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

export const metadata = { title: 'FAQ - AdFlow Pro' }

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">Find answers to the most common questions about using AdFlow Pro.</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-lg font-semibold">How do I post an ad?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-base">
            First, create an account or log in. Navigate to the Dashboard and click &apos;Create New Ad&apos;. Fill in the details, choose your package, and submit it for review. Once approved and paid, your ad goes live!
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-lg font-semibold">How long does moderation take?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-base">
            Our moderation team works 24/7. Typically, ads are reviewed within 2-4 hours of submission.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-lg font-semibold">Can I use AI to write my ad?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-base">
            Yes! AdFlow Pro features an integrated AI Ad Generator. Simply type a rough description, and our AI will format it into a highly converting title and description.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-4">
          <AccordionTrigger className="text-lg font-semibold">How do payments work?</AccordionTrigger>
          <AccordionContent className="text-muted-foreground text-base">
            Currently, we support manual payment verification via transaction references. You submit your payment proof, and an admin will verify it before your ad goes live.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
