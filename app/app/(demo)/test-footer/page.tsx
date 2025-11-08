export default function TestFooterPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-4">Footer Test Page</h1>
      <p className="text-muted-foreground">
        This page has minimal content to test if the footer stays at the bottom of the viewport.
      </p>
      <div className="mt-8 p-4 border border-border rounded">
        <p>The footer should be visible at the bottom of the page, not floating in the middle.</p>
      </div>
    </div>
  );
}