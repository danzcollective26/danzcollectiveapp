# ANEXO · Notas de la lectura del 16/11/2026 (Danz Collective Dev)

> Notas breves, en inglés, que tomó el bot al leer el proyecto de Grok el 16/11/2026, cuando tenía 19 hilos. Sirven para rellenar lo que la captura del 28/11 no recogió (finales de varios hilos y dos hilos que ya no aparecen). Son resúmenes, no texto literal. La numeración T1–T19 es la de entonces, no la de los archivos 01–17.

# Grok "Danz app" project — 19 threads (read-only reading, 2026-11-16)
1 Desarrollo de juego móvil para DANZ Arcade con Phaser ?chat=77697e54-0364-4bf4-9042-922c1e9025fd
2 Desarrollo inicial de Catan del Festival ?chat=905422a7-a3f7-4ce6-807c-826ec76c6c2c
3 Desarrollo inicial del pimball con tests ?chat=8f0b6834-6b2a-46ab-953e-f035b6f0cf70
4 Ideas de recopilatorio de juegos clásicos como Buscaminas inédito ?chat=3d59ab6f-35b3-45c8-ae76-3e026bd8d24d
5 Idea para juego de deducción social en after ?chat=adc4435d-f419-4a6b-a67b-c25a48635aa8
6 Animaciones introductorias para juegos Dance Collective ?chat=834949e7-40ba-426a-bc08-7ce548ae3fde
7 Idea de juego: Drop Defense tower defense rítmico ?chat=43e6ad6f-02ce-46b2-ab72-e408f080320f
8 Mejora del diseño y funciones del proyecto ?chat=c7751461-1036-47f6-b38d-f674e5b464d3
9 Conectar proyecto a repositorio de GitHub ?chat=3c3543f8-b26f-4828-9d8d-79900304b480
10 Creación de Juego After Drop Runner Rítmico ?chat=87462e6d-9610-45fc-99d3-8bb7862530da
11 Entrevista inicial para videojuego Danz Collective 2D ?chat=65dee8b2-c61b-4596-8f65-4b57838fb155
12 Idea de After en Festival Tycoon con inspección de fronteras ?chat=b0147a14-d74a-47df-840c-31382973ef64
13 Desarrollo de Vinyl Survivors roguelike ?chat=01febad7-02d8-4798-bfe4-3067b1c98861
14 Repositorio GitHub privado y complementos para desarrollo Android iOS ?chat=0840b38b-899f-406a-8ded-27fb81fc4660
15 Idea para juego: Heist de Managers con extracción y traiciones ?chat=8c9b17d1-e2a8-499a-9bd9-45fd0ce833f3
16 Estudio y mejora de app Dance Collective con ChatGPT ?chat=c67299dc-c388-41d2-8fa2-89a8203bc747
17 Ideas para juegos y conexión con Codex ?chat=e3cb5a9d-b3c4-4875-a631-322dc66b623d
18 Recuperar conexiones GitHub en nuevo proyecto ChatGPT ?chat=2e25f1a0-9af7-47e9-b633-85acae8b2a16
19 Mejoras para que la app impresione con un upgrade ?chat=a34da438-9763-47b6-9333-cc37dc127d7a

## T1 DANZ Arcade -> DANZ Idle Studio (Phaser/TS)
Started as PULSE rhythm proposal; became DANZ Idle Studio: Habbo-like isometric studio, rooms unlock (Música start; Cocina Música6; Moda Música8; Vídeo Moda8; Los Primos Vídeo8; Sello LosPrimos8; Sala Cocina4; Seguridad Música12), 60 levels per production room, visual upgrade every 2 levels, Loops currency, shelf cap 30, Envíos sells (4 USB=20 Loops; Música lvl2 costs 18), rat every 45s steals 10% (4% with Mono), repair 20 Loops, Mono shop (chaleco, intercomunicador, porra, spray, táser, linterna, cañón de confeti). Operators lvl30 / second station lvl60; staff names Música Luitzmi/Chicharro, Moda Roncero/Juanfran, Vídeo Cosa/Alpi, Impresión Mike/Jokano, Sello León/Tomy. No DANZPOINTS from client; server validates.
Repo: Grok's local commit fe185e7 (~300 files: src/arcade/idle, public/idle, App.tsx, arcadeLibrary.css, docs/DANZ_IDLE_STUDIO.md, tests/e2e/...) NEVER reached GitHub (403, read-only connector). Env restarted, files and zip danz-idle-studio-para-el-repo.zip LOST. Last state: not uploaded; needs restore + write perms + custom sprites (art acknowledged weak).
## T2 Catan del Festival — only Grok's 10-section questionnaire, unanswered. Resources Energía/Dinero/Vinilos/Influencia/Material.
## T3 Pinball — only 16-question questionnaire, unanswered (ideas: Kill the DJ, Protect the Vinyl, Rave Mode; names DANZ Pinball/Afterparty Pin/Vinyl Flip).
## T4 Clásicos -> chose After Monopoly; last: unanswered question on modes (Solo vs IA / Hotseat / Online Supabase / Asíncrono).

## T5 Deducción social -> Collecta mode "AFTER/SABOTAJE" or "VINYL HEIST" (4-8 players, 1-2 saboteurs). Festival Builder proposed fused with Idle Studio (Studio phase + After phase). Pending go-ahead. No code.
## T6 Intro animations 3s: 5 clips generated (common hibiscus-logo intro, Jack/Snake, Groove Ninja, Collecta, Danzporter). Waiting approval "esta va". Not implemented.
## T7 Drop Defense -> 4th Groove Ninja mode + visual polish + easier Scratch Session (ghost path, PERFECTO/CERCA). Files GrooveDropDefense.tsx, grooveDrop.css, edits GrooveNinja.tsx/groove.css. NOT on GitHub (403). Needs write access.
## T8 App redesign mockups only: 5 tabs (Inicio/Pasaporte/Fotos/Arcade/Cuenta). Keep ARCADANZ naming, original colors/typography, DANZ IN, DANZFLOR. Passport socio number "00001" style, ChatGPT reference. Yeppo = animated flower, not cutesy, mix old/new, later AI. Constraint: app not used during the night except stamp QR. Pending refs (passport image, bag photo), more mockups. No code.
## T9 (titled GitHub) actually Collecta redesign: 2D clean arcade, encargado based on Tronco photo, dark vest coral flower; main mode Bomberman-style Arena; Persecución -> "caza" (carry the bill); third mode "Último turno" vs CPU. Pending Tronco reply.
## T10 After Drop runner rítmico: 4 standalone HTML prototypes (afterdrop-prototype/v2/phaser/working.html), Tronco unhappy each time; Grok admits visuals weak, proposes repo integration (src/arcade/afterdrop.ts, AfterDrop.tsx, 5th ArcadeChooser card, ?seccion=arcade&juego=afterdrop). Nothing pushed.

## T11 Mix & Miles / Ron0 2D platformer (vanilla JS single-file HTMLs, many versions, assets failing to load; design docs v5-v21). Last: question on cassette/CD power A-E. No GitHub. Middle partly unread.
## T12 After Queue (Papers Please door) as Collecta mode, src/arcade/afterqueue/. Last: name question. 16 questions unanswered. No code.
## T13 Vinyl Survivors: first question batch, last: camera question. No code.
## T14 Linear project "DANZ Collective App", issues DAN-5..DAN-25 from docs/REVISION_Y_PENDIENTES_DANZ_2026-11-15.md (urgent DAN-8, DAN-22). Vercel needs auth. Last: which issue first.
## T15 Manager Heist: MANAGER-HEIST-SPEC.md/DESIGN.md, design closed, awaiting go-ahead for prototype.
## T16 ChatGPT report study (PWA v51); prompts for ChatGPT; game ideas; SEIS card game designed (src/arcade/seis/), awaiting "¿Sigo?".
## T17 Idea batches + app improvements for single-stage parties (stamps, merch, tickets Eventbrite...). Last: sellos+merch or other priority?
## T18 Connectors are account-level. One exchange.
## T19 Upgrade wow -> points 1,3,5 -> Grok couldn't push (403). NOW DONE by Danz Collective Dev as PR #45.
