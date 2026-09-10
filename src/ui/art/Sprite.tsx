/**
 * Every drawing in the game, as one hidden SVG sprite mounted once at the root.
 *
 * Shapes carry no fill of their own so the caller controls it: <use fill="…"> for the
 * body and rim layers, `color` for the few stroked pieces. That is what lets a single
 * silhouette serve nine realm tiers without a second asset.
 */
export function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
      <symbol id="s-meditate" viewBox="0 0 100 100">
    <path d="M46.8 10.5C47.2 5 52.8 5 53.2 10.5C51.4 9.2 48.6 9.2 46.8 10.5Z"/>
    <path d="M50 12.6C45.9 12.6 42.6 15.9 42.6 20.4C42.6 24 44.8 27 47.8 28.1L47.8 32.5L52.2 32.5L52.2 28.1C55.2 27 57.4 24 57.4 20.4C57.4 15.9 54.1 12.6 50 12.6Z"/>
    <path d="M22 83.5C22 73 30 65 41 64C46 63.5 54 63.5 59 64C70 65 78 73 78 83.5C78 86.6 76 88.4 73 88.4L27 88.4C24 88.4 22 86.6 22 83.5Z"/>
    <path d="M50 30C43.5 30 38.8 34 37.2 41C36.2 46.5 36.4 53 37.6 59C38.4 62.6 40 65 42 66L58 66C60 65 61.6 62.6 62.4 59C63.6 53 63.8 46.5 62.8 41C61.2 34 56.5 30 50 30Z"/>
    <path d="M40 32C33.5 34.5 28 41 26.5 49C25.5 55.5 27.5 62.5 31.5 67.5L39.5 66C35.5 61 33 55 33.2 47.5C33.4 41.5 35.5 36.5 39 33.5Z"/>
    <path d="M60 32C66.5 34.5 72 41 73.5 49C74.5 55.5 72.5 62.5 68.5 67.5L60.5 66C64.5 61 67 55 66.8 47.5C66.6 41.5 64.5 36.5 61 33.5Z"/>
    <path d="M27 51C20 57 14 65.5 11 75.5C17 72.5 24 70.5 30.8 71C29 65 27.6 57.5 27 51Z"/>
    <path d="M73 51C80 57 86 65.5 89 75.5C83 72.5 76 70.5 69.2 71C71 65 72.4 57.5 73 51Z"/>
    <path d="M42 64.5C44.5 62.5 55.5 62.5 58 64.5C58 67.5 55 69 50 69C45 69 42 67.5 42 64.5Z"/>
</symbol>
      <symbol id="s-sword" viewBox="0 0 100 100">
    <path d="M8 86C32 83 68 80 94 77.5L94 81.5C68 84 32 88.5 8 91.5Z"/>
    <path d="M1 86.5L10 85.5L10 92.5L1 93.5Z"/>
    <path d="M13 84L17 83.6L17 93L13 93.4Z"/>
    <path d="M47.4 5.5C47.8 1 52.2 1 52.6 5.5C51.2 4.5 48.8 4.5 47.4 5.5Z"/>
    <path d="M50 7C46.6 7 43.9 9.7 43.9 13.4C43.9 16.4 45.7 18.9 48.2 19.8L48.2 23.5L51.8 23.5L51.8 19.8C54.3 18.9 56.1 16.4 56.1 13.4C56.1 9.7 53.4 7 50 7Z"/>
    <path d="M50 21.5C45 21.5 41.5 24.5 40.4 30C39.6 34.5 39.8 40 40.8 45.5L59.2 45.5C60.2 40 60.4 34.5 59.6 30C58.5 24.5 55 21.5 50 21.5Z"/>
    <path d="M41 43.5C39 50.5 38 60 38 70C38 76.5 38.5 81.5 39 85.5L61 85.5C61.5 81.5 62 76.5 62 70C62 60 61 50.5 59 43.5Z"/>
    <path d="M40 55C31 58 21 63 12 71C22 70 32 68.5 39.5 67Z"/>
    <path d="M38.6 72C31 75 23.5 79 17.5 85.5C25 84.5 33 84 39 84Z"/>
    <path d="M41 23.5C36.5 25.5 33 30 32 36C31.2 41 32.5 46 35 50L40.5 47.5C38.5 44 37.8 40 38.5 35.5C39.1 31.5 40.2 28 42 25.5Z"/>
    <path d="M59 23.5C64.5 25 70.5 28 76 33L72.5 38.5C68 34.5 63.5 31.8 59.5 30.5Z"/>
    <path d="M32.4 38C26 42 20 48 16 56C22 54 28 53 33.6 53.5C32.6 48.5 32.2 43 32.4 38Z"/>
    <path d="M73.4 34C78.4 37.5 82.8 42.5 86 48.5C81 47 75.6 46.5 70.6 47C72 42.5 73 38 73.4 34Z"/>
</symbol>
      <symbol id="s-elder" viewBox="0 0 100 100">
    <path d="M75 10L78 10L74 92L71 92Z"/>
    <circle cx="76.5" cy="6.5" r="4"/>
    <path d="M41.4 7.5C41.8 3 46.2 3 46.6 7.5C45.2 6.5 42.8 6.5 41.4 7.5Z"/>
    <path d="M44 9C40.4 9 37.5 11.9 37.5 15.8C37.5 19 39.4 21.6 42 22.5L42 26.5L46 26.5L46 22.5C48.6 21.6 50.5 19 50.5 15.8C50.5 11.9 47.6 9 44 9Z"/>
    <path d="M35.5 18.5C33 24.5 33.5 31 36.5 38C39 43.5 41.5 47.5 44 50C46.5 47.5 49 43.5 51.5 38C54.5 31 55 24.5 52.5 18.5C50 22.5 38 22.5 35.5 18.5Z"/>
    <path d="M44 27C38.8 27 35.4 30.5 34.4 36C33.6 41 33.8 46.5 34.8 51.5L53.2 51.5C54.2 46.5 54.4 41 53.6 36C52.6 30.5 49.2 27 44 27Z"/>
    <path d="M35.4 49.5C32.9 57 31.4 66.5 31 76C30.6 83 30.2 88 29.8 92L58.2 92C57.8 88 57.4 83 57 76C56.6 66.5 55.1 57 52.6 49.5Z"/>
    <path d="M34.6 29.5C28.6 32.5 23.6 38.5 21.6 46.5C20.1 52.5 20.6 58.5 22.6 63.5L28.6 60.5C27.1 56.5 26.8 51.5 27.6 46.5C28.4 41 30.1 35.5 32.6 31.5Z"/>
    <path d="M21.8 48C15.4 53 10.4 60 7.4 69C13.4 66.5 19.4 65 24.9 65.5C23.2 60 22.1 54 21.8 48Z"/>
    <path d="M53.6 29.5C59.6 31.5 65.6 35.5 70.6 41.5L66.4 46C62.4 41 58 38 54 36.5Z"/>
</symbol>
      <symbol id="s-blade" viewBox="0 0 100 100">
    <path d="M56 34C68 26 80 19 94 14C88 25 78 35 65 42Z"/>
    <path d="M33.4 20.5C33.8 16 38.2 16 38.6 20.5C37.2 19.5 34.8 19.5 33.4 20.5Z"/>
    <path d="M36 22C32.6 22 29.9 24.7 29.9 28.4C29.9 31.4 31.7 33.9 34.2 34.8L34.2 38.5L37.8 38.5L37.8 34.8C40.3 33.9 42.1 31.4 42.1 28.4C42.1 24.7 39.4 22 36 22Z"/>
    <path d="M36 36.5C31 37 27.8 41 27 46.5C26.3 51.5 27 57 28.5 61.5L46 57C45.5 52 44 46.5 42 42C40.3 38.5 38.5 36.5 36 36.5Z"/>
    <path d="M40.5 56.5C44.5 61.5 50.5 69.5 56.5 77.5C59 81 60.5 85 61 89L51.5 89C50.5 85.5 48.5 81.5 45.5 77C42 71.5 37.5 65 34.5 60Z"/>
    <path d="M30 60C27 66 23 74 20 82C18.5 86 18 88 18 89.5L27.5 89.5C28 86.5 29 83 31 79C33.5 74 36 69 38 65Z"/>
    <path d="M40 39C46 38 52 36.2 58 33.6L61.4 40.8C55.4 43.4 49 45.4 43.5 46.4Z"/>
    <path d="M28 48C20 51 12 58 7 68C15 64 23 61 29.5 60Z"/>
    <path d="M27.6 44.5C21 47.5 15.4 53.5 11.8 61.5C17.8 59 23.8 57.5 29 58C27.8 53.5 27.4 49 27.6 44.5Z"/>
</symbol>
      <symbol id="s-zither" viewBox="0 0 100 100">
    <path d="M46.8 10.5C47.2 5 52.8 5 53.2 10.5C51.4 9.2 48.6 9.2 46.8 10.5Z"/>
    <path d="M50 12.6C45.9 12.6 42.6 15.9 42.6 20.4C42.6 24 44.8 27 47.8 28.1L47.8 32.5L52.2 32.5L52.2 28.1C55.2 27 57.4 24 57.4 20.4C57.4 15.9 54.1 12.6 50 12.6Z"/>
    <path d="M24 84C24 74 31.5 66.5 42 65.5C46.5 65 53.5 65 58 65.5C68.5 66.5 76 74 76 84C76 87 74 88.6 71 88.6L29 88.6C26 88.6 24 87 24 84Z"/>
    <path d="M50 30C43.5 30 38.8 34 37.2 41C36.2 46.5 36.4 53 37.6 59C38.4 62.6 40 65 42 66L58 66C60 65 61.6 62.6 62.4 59C63.6 53 63.8 46.5 62.8 41C61.2 34 56.5 30 50 30Z"/>
    <path d="M40 32C33.5 34 28.5 39 26 45.5C24 51 24 56 25.5 60.5L33 58C32 54.5 32.2 50.5 33.4 46.5C34.4 42.5 36.2 38.5 39 34.5Z"/>
    <path d="M60 32C66.5 34 71.5 39 74 45.5C76 51 76 56 74.5 60.5L67 58C68 54.5 67.8 50.5 66.6 46.5C65.6 42.5 63.8 38.5 61 34.5Z"/>
    <path d="M6 60.5C6 55.8 12 52.8 21 52.8L80 53.8C89 54.3 94 57.3 94 61.8C94 66.3 89 69.3 80 69.8L21 70.8C12 70.8 6 67.8 6 62.8Z"/>
    <path d="M18 71L24 71L23 77L17 77Z"/>
    <path d="M77 70L83 70L84 76L78 76Z"/>
</symbol>
      <symbol id="s-ascend" viewBox="0 0 100 100">
    <path d="M46.8 8.5C47.2 3 52.8 3 53.2 8.5C51.4 7.2 48.6 7.2 46.8 8.5Z"/>
    <path d="M50 10.6C45.9 10.6 42.6 13.9 42.6 18.4C42.6 22 44.8 25 47.8 26.1L47.8 30.5L52.2 30.5L52.2 26.1C55.2 25 57.4 22 57.4 18.4C57.4 13.9 54.1 10.6 50 10.6Z"/>
    <path d="M50 28C43.5 28 38.8 32 37.2 39C36.5 43 36.4 47.5 36.9 52L63.1 52C63.6 47.5 63.5 43 62.8 39C61.2 32 56.5 28 50 28Z"/>
    <path d="M40 30C33.5 32.5 28 39 26.5 47C25.9 51 26.3 55 27.6 58.5L34.8 56C34 53 33.8 50 34.2 46.5C34.8 40.5 36.5 35.5 39 31.5Z"/>
    <path d="M60 30C66.5 32.5 72 39 73.5 47C74.1 51 73.7 55 72.4 58.5L65.2 56C66 53 66.2 50 65.8 46.5C65.2 40.5 63.5 35.5 61 31.5Z"/>
    <path d="M30 58.5C39 55.5 61 55.5 70 58.5L71.5 67C61 63 39 63 28.5 67Z"/>
    <path opacity=".85" d="M25 74C36.5 70 63.5 70 75 74L77 82.5C63 78 37 78 23 82.5Z"/>
    <path opacity=".6" d="M20 88.5C34.5 85.5 65.5 85.5 80 88.5L80 91.5L20 91.5Z"/>
</symbol>
      <symbol id="s-serpent" viewBox="0 0 100 100">
    <path fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
          d="M14 88C14 68 42 74 56 62C70 50 58 34 44 39"/>
    <path fillRule="evenodd" d="M44 46C36 46 30 41 30 34C30 27 36 22 44 22C52 22 58 27 58 34C58 41 52 46 44 46ZM46.4 31a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0-5.2 0Z"/>
    <path d="M30 30L16 25L30 23Z"/>
  </symbol>
      <symbol id="s-crane" viewBox="0 0 100 100">
    <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          d="M44 66L41 88M54 66L58 88M34 89L48 89M52 89L66 89"/>
    <path d="M30 56C30 46 40 40 52 40C66 40 78 46 82 56C76 66 62 70 52 70C40 70 30 66 30 56Z"/>
    <path d="M31 53C23 49 12 49 4 53C12 57 22 61 31 62Z"/>
    <path fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" d="M60 44C64 32 60 21 68 16"/>
    <path fillRule="evenodd" d="M68 21C63 21 60 18 60 14C60 10 63 7 68 7C73 7 76 10 76 14C76 18 73 21 68 21ZM66.4 12a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0Z"/>
    <path d="M76 12L95 15L76 18Z"/>
    <path opacity=".45" d="M42 46C52 44 65 46 74 52C64 57 51 58 41 56Z"/>
  </symbol>
      <symbol id="s-fox" viewBox="0 0 100 100">
    <path opacity=".4" d="M42 60C34 46 32 30 36 14C39 30 45 44 49 52Z"/>
    <path opacity=".5" d="M44 58C42 42 46 26 56 13C52 30 53 46 51 54Z"/>
    <path opacity=".45" d="M40 62C28 56 16 42 12 25C22 38 34 48 44 53Z"/>
    <path opacity=".55" d="M40 64C26 62 12 54 4 41C16 50 30 56 42 57Z"/>
    <path opacity=".65" d="M40 66C26 71 12 71 2 64C14 65 28 62 42 60Z"/>
    <path d="M44 56C48 46 58 41 68 43C79 45 85 54 85 65C85 76 79 84 70 85L48 85C42 80 40 68 44 56Z"/>
    <path d="M60 28L57 13L70 24Z"/>
    <path d="M85 28L89 13L77 23Z"/>
    <path fillRule="evenodd" d="M69 45C62 45 57 40 57 34C57 27 64 22 72 22C81 22 87 27 87 34C87 40 82 45 76 45ZM70.4 32a2.1 2.1 0 1 0 4.2 0a2.1 2.1 0 1 0-4.2 0Z"/>
    <path d="M86 35L99 38L86 42Z"/>
  </symbol>
      <symbol id="s-ape" viewBox="0 0 100 100">
    <path d="M31 54C35 42 46 36 58 38C72 40 80 51 80 65C80 78 72 88 60 88L38 88C28 88 24 77 26 67C27 61 29 58 31 54Z"/>
    <path d="M32 52C19 56 9 67 7 82C13 84 19 81 21 74C23 65 27 57 34 55Z"/>
    <path d="M78 54C91 58 98 69 98 83C93 85 87 82 86 76C85 67 82 59 76 57Z"/>
    <path fillRule="evenodd" d="M56 39C45 39 38 31 38 22C38 12 46 5 56 5C66 5 74 12 74 22C74 31 67 39 56 39ZM47.4 20a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0ZM60.4 20a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0Z"/>
    <path opacity=".32" d="M37 62L50 57L48 73L35 75Z"/>
    <path opacity=".32" d="M60 60L72 64L69 78L58 74Z"/>
  </symbol>
      <symbol id="s-tiger" viewBox="0 0 100 100">
    <path d="M22 56C22 46 32 40 46 40L64 40C76 40 84 46 84 56C84 62 80 67 74 68L30 68C25 66 22 62 22 56Z"/>
    <path d="M28 66L37 66L35 88L26 88Z"/>
    <path d="M46 66L55 66L53 88L44 88Z"/>
    <path d="M63 66L72 66L74 88L65 88Z"/>
    <path fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
          d="M83 51L92 42L85 39L93 28"/>
    <path d="M10 28L8 15L21 24Z"/>
    <path d="M37 28L41 15L29 23Z"/>
    <path fillRule="evenodd" d="M22 53C13 53 7 46 7 38C7 29 15 23 24 23C33 23 41 29 41 38C41 46 34 53 26 53ZM15.4 36a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0ZM27.4 36a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0Z"/>
    <path opacity=".32" d="M49 41L56 41L52 67L45 67Z"/>
    <path opacity=".32" d="M64 41L71 41L67 67L60 67Z"/>
  </symbol>
      <symbol id="s-wraith" viewBox="0 0 100 100">
    <path fillRule="evenodd" d="M50 8C36 8 26 20 26 36C26 48 24 60 20 70C26 68 30 72 34 78C38 84 44 87 50 87C56 87 62 84 66 78C70 72 74 68 80 70C76 60 74 48 74 36C74 20 64 8 50 8ZM38.5 31a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0ZM52.5 31a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0-9 0Z"/>
    <path opacity=".35" d="M34 84C30 90 24 94 15 97C24 92 28 88 30 82Z"/>
    <path opacity=".35" d="M66 84C70 90 76 94 85 97C76 92 72 88 70 82Z"/>
  </symbol>
      <symbol id="g-frost" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round">
    <path strokeWidth="3.2" d="M7 33C13 22 21 14 31 9"/>
    <path strokeWidth="2" opacity=".6" d="M13 36C19 27 26 20 34 16"/>
    <path strokeWidth="2" d="M28 5V15M23.5 7.5L32.5 12.5M32.5 7.5L23.5 12.5"/></g></symbol>
      <symbol id="g-thread" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round">
    <path strokeWidth="3.6" d="M6 34L34 6"/><path strokeWidth="1.5" opacity=".55" d="M14 35L32 17"/></g></symbol>
      <symbol id="g-cloud" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round">
    <path strokeWidth="3" d="M5 17C9 10 18 9 22 15C27 11 35 14 35 21"/>
    <path strokeWidth="2.4" opacity=".7" d="M9 27C16 24 26 24 33 27"/>
    <path strokeWidth="2" opacity=".45" d="M14 33C19 31 24 31 29 33"/></g></symbol>
      <symbol id="g-thunder" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path strokeWidth="3.4" d="M23 4L11 21H21L14 36"/>
    <path strokeWidth="2" opacity=".5" d="M29 7L35 3M31 18L37 16"/></g></symbol>
      <symbol id="g-bell" viewBox="0 0 40 40">
    <g fill="none" stroke="currentColor"><path strokeWidth="3" d="M9 28C9 15 14 7 20 7C26 7 31 15 31 28"/>
    <path strokeWidth="3" strokeLinecap="round" d="M6 29H34"/></g><circle cx="20" cy="34" r="2.6"/></symbol>
      <symbol id="g-blood" viewBox="0 0 40 40">
    <path d="M19 5C24 14 28 19 28 24C28 29 24 33 19 33C14 33 10 29 10 24C10 19 14 14 19 5Z"/>
    <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5" d="M32 11L37 6M33 22L38 20"/></symbol>
      <symbol id="g-swordrain" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round">
    <path strokeWidth="2.8" d="M9 5L13 24M20 3L24 26M31 6L35 22"/>
    <path strokeWidth="2" opacity=".45" d="M7 33H33"/></g></symbol>
      <symbol id="g-heart" viewBox="0 0 40 40">
    <path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
          d="M28 20C28 13 22 9 16 11C10 13 9 21 14 26C20 31 30 28 33 21"/><circle cx="20" cy="20" r="3.2"/></symbol>
      <symbol id="g-pillfire" viewBox="0 0 40 40">
    <g fill="none" stroke="currentColor"><path strokeWidth="2.8" d="M11 24C11 31 15 35 20 35C25 35 29 31 29 24Z"/>
    <path strokeWidth="2.6" strokeLinecap="round" d="M7 24H33"/></g>
    <path d="M20 3C24 10 26 14 24 18C22 21 18 21 16 18C14 14 16 10 20 3Z"/></symbol>
      <symbol id="g-bone" viewBox="0 0 40 40">
    <path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" d="M20 4V36M7 12L33 28M33 12L7 28"/>
    <circle cx="20" cy="20" r="3.2"/></symbol>
      <symbol id="g-wind" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round">
    <path strokeWidth="2.8" d="M4 13C15 8 27 10 31 14C34 17 31 21 27 20"/>
    <path strokeWidth="2.4" opacity=".7" d="M6 23C17 19 27 20 30 24C32 27 29 31 26 30"/>
    <path strokeWidth="1.8" opacity=".45" d="M10 32C16 30 22 31 24 33"/></g></symbol>
      <symbol id="g-void" viewBox="0 0 40 40">
    <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" d="M30 11A13 13 0 1 0 30 29"/>
    <circle cx="31" cy="20" r="3.2"/></symbol>
      <symbol id="g-cauldron" viewBox="0 0 40 40"><g fill="none" stroke="currentColor">
    <path strokeWidth="2.6" d="M9 19C9 29 14 34 20 34C26 34 31 29 31 19Z"/>
    <path strokeWidth="2.6" strokeLinecap="round" d="M5 19H35"/>
    <path strokeWidth="2.4" d="M13 15C13 9 16 6 20 6C24 6 27 9 27 15"/>
    <path strokeWidth="2.2" strokeLinecap="round" d="M13 34L11 38M27 34L29 38"/></g></symbol>
      <symbol id="g-stone" viewBox="0 0 40 40">
    <path fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" d="M20 4L33 14L28 34H12L7 14Z"/>
    <path opacity=".55" d="M20 12L26 17L23 28H17L14 17Z"/></symbol>
      <symbol id="g-talisman" viewBox="0 0 40 40"><g fill="none" stroke="currentColor">
    <path strokeWidth="2.6" strokeLinejoin="round" d="M13 4H27V30L20 36L13 30Z"/>
    <path strokeWidth="2" strokeLinecap="round" d="M20 10V25M15 14H25M16 20H24"/></g></symbol>
      <symbol id="g-flysword" viewBox="0 0 40 40"><g fill="none" stroke="currentColor" strokeLinecap="round">
    <path strokeWidth="3.4" d="M14 27L35 6"/><path strokeWidth="2.6" d="M8 25L16 33M6 32L11 37"/></g></symbol>
      <symbol id="u-cultivate" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 19C6 19 3 15 3 11C6 11 9 13 12 17C15 13 18 11 21 11C21 15 18 19 12 19Z"/>
    <path d="M12 17C10 13 10 8 12 4C14 8 14 13 12 17Z"/></g></symbol>
      <symbol id="u-lineage" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" d="M12 6V12M12 12H7V17M12 12H17V17"/>
    <circle cx="12" cy="4" r="2"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/></g></symbol>
      <symbol id="u-meridians" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M12 4V20"/><path d="M12 8C9.2 9 7.6 11.2 7.2 14.2"/><path d="M12 8C14.8 9 16.4 11.2 16.8 14.2"/></g>
    <g fill="currentColor"><circle cx="12" cy="4" r="1.7"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="20" r="1.7"/>
    <circle cx="7" cy="15.6" r="1.5"/><circle cx="17" cy="15.6" r="1.5"/></g></symbol>
      <symbol id="u-techniques" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinejoin="round" d="M6 4H18V20H6Z"/><path strokeLinecap="round" d="M9 9H15M9 13H15M9 17H12"/></g></symbol>
      <symbol id="u-sect" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M3 7L12 3L21 7"/><path d="M5 9V20M19 9V20M3 20H21M12 20V13"/></g></symbol>
      <symbol id="s-qilin" viewBox="0 0 100 100">
    <path d="M24 54C24 45 32 39 44 39L62 39C73 39 81 45 81 54C81 60 77 64 71 65L30 65C26 63 24 59 24 54Z"/>
    <path d="M29 63L37 63L34 87L26 87Z"/>
    <path d="M45 63L53 63L50 87L42 87Z"/>
    <path d="M62 63L70 63L72 87L64 87Z"/>
    <path d="M74 63L81 63L83 87L76 87Z"/>
    <path opacity=".55" d="M80 50C87 44 93 34 95 22C92 34 88 44 82 52Z"/>
    <path opacity=".7" d="M80 54C88 51 95 44 99 34C95 46 89 54 81 58Z"/>
    <path fillRule="evenodd" d="M24 51C16 51 10 45 10 37C10 28 17 22 26 22C35 22 42 28 42 37C42 45 34 51 27 51ZM17.4 35a2.3 2.3 0 1 0 4.6 0a2.3 2.3 0 1 0-4.6 0Z"/>
    <path d="M14 24L6 10L20 20Z"/>
    <path d="M32 22L36 6L40 22Z"/>
    <path opacity=".6" d="M42 32C50 26 60 22 70 21C60 26 51 32 45 38Z"/>
    <path d="M10 38L1 41L10 45Z"/>
  </symbol>
      <symbol id="s-roc" viewBox="0 0 100 100">
    <path d="M46 44C46 38 50 34 56 34C62 34 66 38 66 45C66 54 62 62 56 66C50 62 46 53 46 44Z"/>
    <path d="M46 42C36 34 22 28 4 26C20 32 32 40 42 50Z"/>
    <path d="M66 42C76 34 90 28 98 26C84 32 72 40 66 50Z"/>
    <path opacity=".5" d="M46 50C37 46 25 44 12 45C25 48 36 53 44 58Z"/>
    <path opacity=".5" d="M66 50C75 46 87 44 96 45C84 48 74 53 66 58Z"/>
    <path d="M53 65L57 65L56 78L54 78Z"/>
    <path d="M50 77L60 77L58 84L52 84Z"/>
    <path fillRule="evenodd" d="M56 34C51 34 48 30.5 48 26C48 21 52 17.5 57 17.5C62 17.5 66 21 66 26C66 30.5 62 34 57 34ZM54.4 24a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0Z"/>
    <path d="M48 24L34 21L48 18Z"/>
    <path d="M62 18L66 6L69 19Z"/>
  </symbol>
      <symbol id="s-hare" viewBox="0 0 100 100">
    <path d="M32 66C32 55 41 48 54 48C68 48 78 56 78 68C78 78 71 84 60 84L42 84C35 84 32 78 32 66Z"/>
    <path d="M36 46L28 20L46 42Z"/>
    <path d="M48 44L50 17L60 42Z"/>
    <path fillRule="evenodd" d="M36 62C28 62 23 57 23 50C23 43 29 38 37 38C45 38 51 43 51 50C51 57 45 62 38 62ZM28.4 48a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Z"/>
    <path d="M23 52L12 55L23 58Z"/>
    <path opacity=".5" d="M78 70C86 66 92 60 95 52C93 62 88 70 80 76Z"/>
    <path d="M40 82L46 82L45 88L38 88Z"/>
    <path d="M62 82L70 82L72 88L63 88Z"/>
  </symbol>
      <symbol id="s-beetle" viewBox="0 0 100 100">
    <path d="M20 62C20 50 32 42 50 42C68 42 80 50 80 62C80 72 70 78 50 78C30 78 20 72 20 62Z"/>
    <path opacity=".4" d="M50 44C56 50 58 58 57 76L43 76C42 58 44 50 50 44Z"/>
    <path d="M32 40C28 32 30 24 38 20C34 27 34 33 38 39Z"/>
    <path d="M68 40C72 32 70 24 62 20C66 27 66 33 62 39Z"/>
    <path fillRule="evenodd" d="M50 44C40 44 34 38 34 31C34 24 41 19 50 19C59 19 66 24 66 31C66 38 60 44 50 44ZM41.4 30a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0ZM53.4 30a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Z"/>
    <path d="M46 20L50 4L54 20Z"/>
    <path d="M22 66L12 74L15 78L26 72Z"/>
    <path d="M78 66L88 74L85 78L74 72Z"/>
    <path d="M28 76L22 88L28 88L34 78Z"/>
    <path d="M72 76L78 88L72 88L66 78Z"/>
  </symbol>
      <symbol id="s-alchemist" viewBox="0 0 100 100">
    <path d="M46.8 8.5C47.2 3 52.8 3 53.2 8.5C51.4 7.2 48.6 7.2 46.8 8.5Z"/>
    <path d="M50 10.6C45.9 10.6 42.6 13.9 42.6 18.4C42.6 22 44.8 25 47.8 26.1L47.8 30.5L52.2 30.5L52.2 26.1C55.2 25 57.4 22 57.4 18.4C57.4 13.9 54.1 10.6 50 10.6Z"/>
    <path d="M50 28C43.5 28 39 32 37.4 39C36.4 44.5 36.6 51 37.8 57L62.2 57C63.4 51 63.6 44.5 62.6 39C61 32 56.5 28 50 28Z"/>
    <path d="M40 30C34 32.5 29.5 38 28 45C27 50 27.6 55 29.5 59L36 56C34.8 52.5 34.6 48.5 35.4 44.5C36.2 39.5 37.8 35 40.5 31.5Z"/>
    <path d="M60.5 30.5C67 30 73.5 27 79 21.5L83.5 27C77 34 69 38 60 38.5Z"/>
    <path d="M84 12C87.5 17 89 21 87 24.5C85 27.5 80.5 27.5 78.5 24.5C76.5 21 78.5 17 84 12Z"/>
    <path d="M22 62.5C22 59.2 26.5 57.4 33 57.4L67 57.4C73.5 57.4 78 59.2 78 62.5C78 65.8 73.5 67.6 67 67.6L33 67.6C26.5 67.6 22 65.8 22 62.5Z"/>
    <path d="M26.5 66C27.5 78 34 86.5 50 86.5C66 86.5 72.5 78 73.5 66Z"/>
    <path d="M31 85L28 92L34 92L36 85Z"/>
    <path d="M69 85L72 92L66 92L64 85Z"/>
  </symbol>
      <symbol id="s-body" viewBox="0 0 100 100">
    <path d="M50 5.5C46.4 5.5 43.6 8.2 43.6 11.8C43.6 14.8 45.5 17.3 48.1 18.2L48.1 22L51.9 22L51.9 18.2C54.5 17.3 56.4 14.8 56.4 11.8C56.4 8.2 53.6 5.5 50 5.5Z"/>
    <path d="M41.5 9.5L58.5 9.5L58.5 12.5L41.5 12.5Z"/>
    <path d="M50 20C43 20 38 24 36.2 31C34.8 36.5 34.6 43 35.6 49C36.2 52.5 37.4 55 39 56.5L61 56.5C62.6 55 63.8 52.5 64.4 49C65.4 43 65.2 36.5 63.8 31C62 24 57 20 50 20Z"/>
    <path d="M38 23C30.5 25.5 25 31.5 23 40C21.5 46.5 23 52.5 26.5 57L34 53C31.5 49.5 31 45 32 40C33 35 35 30 38 26.5Z"/>
    <path d="M62 23C69.5 25.5 75 31.5 77 40C78.5 46.5 77 52.5 73.5 57L66 53C68.5 49.5 69 45 68 40C67 35 65 30 62 26.5Z"/>
    <path d="M25 55C22 57.5 21 61 22.5 64C24 67 27.5 67.5 30.5 65.5C33 63.8 33.5 60.5 32 57.5Z"/>
    <path d="M75 55C78 57.5 79 61 77.5 64C76 67 72.5 67.5 69.5 65.5C67 63.8 66.5 60.5 68 57.5Z"/>
    <path d="M39 55C36.5 62 34 70 32 78C30.8 83 30.2 87 30 90.5L41.5 90.5C41.8 87 42.5 83 43.5 78C44.8 71.5 46 65 46.6 59Z"/>
    <path d="M61 55C63.5 62 66 70 68 78C69.2 83 69.8 87 70 90.5L58.5 90.5C58.2 87 57.5 83 56.5 78C55.2 71.5 54 65 53.4 59Z"/>
    <path d="M37 51C29 53 21 57 14 63C22 62.5 30 62 36 62.5Z"/>
    <path d="M36.5 63.5C29 66.5 22 71 16 77.5C24 75.5 31.5 74.5 37 74.5Z"/>
  </symbol>
      </defs>
    </svg>
  )
}
