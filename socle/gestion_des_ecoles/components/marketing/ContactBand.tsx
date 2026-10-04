import Image from "next/image";
import { PUBLIC_CONTACT } from "@/components/eduadmins/public-chrome";
import { MktButton } from "@/components/marketing/MktButton";
import { MARKETING_IMAGES } from "@/lib/marketing-images";

export function ContactBand() {
  return (
    <section id="contact" className="scroll-mt-28 bg-background">
      <div className="marketing-reveal mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-card shadow-[0_24px_60px_rgb(11_47_122_/_0.1)] outline outline-1 outline-black/5">
          <div className="grid items-center md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[26rem]">
              <Image
                src={MARKETING_IMAGES.trust}
                alt="Équipe et établissement scolaire au Sénégal."
                fill
                loading="lazy"
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-8 sm:p-10 md:p-14">
              <h2 className="font-display max-w-[14ch] text-balance text-3xl font-medium tracking-[-0.03em] text-[color:var(--color-ink)] md:text-[2.6rem] md:leading-tight">
                Nous contacter
              </h2>
              <p className="mt-4 max-w-[42ch] text-pretty leading-7 text-muted-foreground">
                NOVA HOLDINGS active EduApps pour les établissements partenaires au Sénégal.
                Écrivez-nous ou appelez-nous pour en savoir plus.
              </p>
              <ul className="mt-8 space-y-2 text-sm text-[color:var(--color-ink)]">
                <li>
                  <a className="font-medium transition-colors hover:text-primary" href={PUBLIC_CONTACT.phoneHref}>
                    {PUBLIC_CONTACT.phone}
                  </a>
                </li>
                <li>
                  <a className="font-medium transition-colors hover:text-primary" href={PUBLIC_CONTACT.emailHref}>
                    {PUBLIC_CONTACT.email}
                  </a>
                </li>
                <li className="text-muted-foreground">{PUBLIC_CONTACT.address}</li>
              </ul>
              <div className="mt-8">
                <MktButton
                  href={`${PUBLIC_CONTACT.emailHref}?subject=${encodeURIComponent("Contact EduApps")}`}
                >
                  Écrire à NOVA
                </MktButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
