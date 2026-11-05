// Home and You in the Figma redesign (frames 160:4915 / 160:4949): the
// graduation mascot over a clock, "Coming Soon", one line under it.
import { SITE, useSeo } from '../lib/seo';

export default function ComingSoon({ title }: { title: string }) {
  useSeo({ title: `${title} · ${SITE}`, noindex: true });
  return (
    <section className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-24 pt-16 dark:bg-[radial-gradient(120%_90%_at_50%_45%,#161d2c_0%,#141414_60%)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[38%] h-[412px] w-[687px] max-w-[160vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(48,105,255,0.22),rgba(48,105,255,0))] dark:bg-[radial-gradient(closest-side,rgba(30,90,255,0.38),rgba(30,90,255,0))]"
      />
      <div className="relative flex w-[296px] flex-col items-center text-center">
        <img src="/app/coming-soon.webp" width={296} height={235} alt="" className="h-auto w-[296px]" />
        <h1 className="mt-[10px] font-serif text-[48px] leading-[56px] text-[#0e193b] dark:text-[#dae7e0]">
          Coming <span className="text-[#456dff]">Soon</span>
        </h1>
        <p className="mt-[9px] text-sm leading-5 text-[#6b6e6c] dark:text-[#8e918f]">
          Something exciting is on the way!
          <br />
          Stay tuned for updates.
        </p>
      </div>
    </section>
  );
}
