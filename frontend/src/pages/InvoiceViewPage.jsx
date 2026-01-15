import { InvoiceView, Container } from "../components";

export function InvoiceViewPage()
{
    return (
  // InvoicePage.js
<div className="min-h-screen w-full bg-slate-50 py-10">
    <Container className="max-w-6xl! bg-transparent! border-none! shadow-none! p-0!">
        <InvoiceView />
    </Container>
</div>
    )
}