"use client";

export function FooterSection() {
  return (
    <footer className="border-t border-border bg-card px-6 py-12 md:px-12 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:justify-between md:text-left">
          {/* Branding */}
          <div className="max-w-sm">
            <h3 className="font-serif text-xl font-semibold text-foreground">
              Kindred Echo
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              A private AI memory room for preserving family stories. Built with
              care and transparency.
            </p>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Support Resources
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://988lifeline.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 transition-colors hover:text-lavender hover:underline"
                >
                  988 Suicide & Crisis Lifeline
                </a>
              </li>
              <li>
                <a
                  href="https://www.griefshare.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 transition-colors hover:text-lavender hover:underline"
                >
                  GriefShare Support Groups
                </a>
              </li>
              <li>
                <a
                  href="https://www.psychologytoday.com/us/therapists/grief"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 transition-colors hover:text-lavender hover:underline"
                >
                  Find a Grief Therapist
                </a>
              </li>
            </ul>
          </div>

          {/* Project Links */}
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Project
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/hareeshkar/kindred-echo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 transition-colors hover:text-lavender hover:underline"
                >
                  View Source
                </a>
              </li>
              <li>
                <a
                  href="#consent"
                  className="text-foreground underline-offset-4 transition-colors hover:text-lavender hover:underline"
                >
                  Begin Experience
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            <strong>Hackathon Project Disclaimer:</strong> Kindred Echo is an
            educational demonstration built for a hackathon. This is not a
            production service. Voice recreations are AI-generated using MiniMax
            and should not be considered authentic recordings of any person.
            This tool does not replace professional grief support, therapy, or
            community connection.
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Built with care. If you&apos;re struggling with grief, please reach out
            to the support resources above or speak with someone you trust.
          </p>
        </div>
      </div>
    </footer>
  );
}
