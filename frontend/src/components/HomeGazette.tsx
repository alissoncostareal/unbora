import { Link } from 'react-router-dom';

import { goToSection, homeSections } from '../lib/scrollSection';

const atmospheres = [
  {
    match: '98% Match editorial',
    place: 'Aldeota',
    title: 'Uritu Cafés Especiais',
    price: 'R$ R$',
    line: 'Cimento queimado · Concreto e folhagens',
    text: 'Paredes com textura mineral, móveis de madeira curvilínea e uma iluminação pendente dourada que convida à contemplação matinal. Grãos de pequenos produtores da Ibiapaba e Mantiqueira.',
    tags: ['Luz natural filtrada', 'Trilha lo-fi'],
    quote: 'O refúgio definitivo para começar um sábado sem notificações ativas.',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=70',
    alt: 'Balcão de café com luz de manhã, imagem de referência',
  },
  {
    match: '95% Match editorial',
    place: 'Praia de Iracema',
    title: 'Bistrô Cais & Brisa',
    price: 'R$ R$ R$',
    line: 'Terraço aberto · Pôr do sol alencarino',
    text: 'Varanda elevada sobre o calçadão, toalha de linho rústica e cerâmica artesanal. Peixe branco curado no limão-cravo com caju confitado e taças de vinho natural sob as luzes da enseada.',
    tags: ['Vento litorâneo', 'Crepúsculo dourado'],
    quote: 'A sensação de estar de férias na sua própria cidade natal.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=70',
    alt: 'Mesa posta ao fim da tarde, imagem de referência',
  },
  {
    match: '99% Match editorial',
    place: 'Meireles / Aldeota',
    title: 'Livraria Garôa & Pátio',
    price: 'R$ R$',
    line: 'Pergolado de madeira · Jardim interno',
    text: 'Um pátio protegido com piso de terracota, samambaias exuberantes e acervo de literatura nordestina, poesia e arquitetura. Ideal para esquecer o relógio com uma xícara longa.',
    tags: ['Clima de jardim', 'Poltronas confortáveis'],
    quote: 'Onde as ideias encontram espaço para respirar sem pressa.',
    image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=70',
    alt: 'Estante e leitura, imagem de referência',
  },
];

const voices = [
  {
    mark: 'L',
    name: 'Lívia Vasconcelos',
    role: 'Arquiteta',
    text: 'Cansada de guias patrocinados que sempre me mandavam para os mesmos lounges barulhentos. No Unbora encontrei cafés com acústica perfeita para debater projetos sem disputar volume com caixas de som.',
  },
  {
    mark: 'M',
    name: 'Matheus Alencar',
    role: 'Designer gráfico',
    text: 'O filtro por intenção mudou minhas terças-feiras à noite. Quando saio do escritório querendo apenas vinho gelado e conversa sem pressa, basta abrir o app e a primeira sugestão é tiro e queda.',
  },
  {
    mark: 'C',
    name: 'Dra. Clara Mendes',
    role: 'Médica',
    text: 'Trabalho sob altíssima pressão em plantões hospitalares. Ter um guia que respeita o silêncio, a iluminação baixa e a comida feita com carinho é como receber uma receita de autocuidado para a alma.',
  },
];

export function HomeGazette({ city }: { city: string }) {
  const placeName = city.trim() || 'sua cidade';
  const voicePlaces = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Recife']
    .filter((name) => name.localeCompare(placeName, 'pt-BR', { sensitivity: 'base' }) !== 0)
    .slice(0, 3);

  return (
    <div>
      <section id="como-funciona" className="bg-[#1c1917] px-6 py-24 text-[#efeae3] lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#ffdad2] uppercase">
              <span className="h-px w-6 bg-[#9a4632]" />
              Como funciona
            </p>
            <p className="mt-3 text-[11px] font-semibold tracking-[0.16em] text-[#a89f91] uppercase">Três passos</p>
          </div>
          <div className="lg:col-span-9">
            <h2 className="max-w-[16ch] text-4xl leading-[1.05] font-light tracking-tight text-[#fff8f5] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.05]">
              {placeName === 'sua cidade' ? 'Sua cidade' : placeName} tem lugar de sobra. Você não precisa ver todos.
            </h2>
            <p className="mt-6 max-w-3xl text-[17px] leading-8 text-[#d1c6b8]">
              Diz como você está, com quem vai e quanto tempo tem. O Unbora indica um lugar real, com endereço e o motivo da escolha.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-16 grid max-w-7xl gap-6 md:grid-cols-3">
          <Principle
            index="01"
            title="Pelo momento"
            text="A primeira pergunta é como você quer passar a próxima hora: quieto, animado, com alguém ou sozinho. A sugestão começa por aí."
            foot="Como você está"
          />
          <Principle
            index="02"
            title="Um lugar, não uma lista"
            text="A resposta vem com nome e endereço. Se o mapa tiver foto daquele lugar, ela aparece junto. Você vê o lugar antes de decidir se sai."
            foot="Nome, rua e foto"
          />
          <Principle
            index="03"
            title="Com o motivo"
            text="Junto da sugestão vem o porquê daquele lugar. Se não fizer sentido, pede outra. A decisão de sair continua sua."
            foot="Por que esse lugar"
          />
        </div>
      </section>

      <section id="destaques" className="bg-white px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="pb-12">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#7c2f1d] uppercase">
              Edição modelo · Fortaleza <span className="text-[#55433e]">· Caderno de destinos</span>
            </p>
            <h2 className="mt-2 text-4xl font-light tracking-tight sm:text-5xl">Três atmosferas em evidência</h2>
          </div>
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {atmospheres.map((item) => (
              <article key={item.title} className="flex flex-col overflow-hidden rounded-xl bg-[#fff8f5] shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#f4ece8]">
                  <img className="h-full w-full object-cover" src={item.image} alt={item.alt} />
                  <span className="absolute top-3 left-3 rounded bg-[#fff8f5]/90 px-2 py-1 text-[11px] font-semibold tracking-[0.08em] text-[#7c2f1d] uppercase">
                    {item.match}
                  </span>
                  <span className="absolute right-3 bottom-3 rounded bg-[#1e1b19]/80 px-2 py-0.5 text-[11px] font-semibold tracking-[0.1em] text-[#fff8f5] uppercase">
                    {item.place}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
                    <span className="shrink-0 text-[11px] tracking-[0.12em] text-[#55433e] uppercase">{item.price}</span>
                  </div>
                  <p className="mt-2 text-[11px] font-semibold tracking-[0.1em] text-[#7c2f1d] uppercase">{item.line}</p>
                  <p className="mt-3 text-sm leading-6 text-[#55433e]">{item.text}</p>
                  <div className="mt-5 rounded-lg bg-[#faf2ee] p-3">
                    <p className="flex flex-wrap justify-between gap-2 text-[11px] font-semibold tracking-[0.08em] text-[#55433e] uppercase">
                      {item.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </p>
                    <p className="mt-2 text-sm text-[#1e1b19] italic">“{item.quote}”</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="perspectivas" className="bg-[#f2e3dd] px-6 py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-baseline gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-[#7c2f1d] uppercase">
              <span className="grid h-4 w-4 place-items-center rounded bg-[#7c2f1d] text-[10px] text-white">”</span>
              Perspectivas reais
            </p>
            <h2 className="mt-2 text-4xl font-light tracking-tight sm:text-5xl">A cidade redigida por quem caminha nela</h2>
          </div>
          <p className="text-sm leading-6 text-[#55433e] lg:col-span-4">
            Nossos correspondentes e leitores ativos compartilham a percepção sensorial de suas rotinas semanais por {placeName}.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-7xl gap-6 md:grid-cols-3">
          {voices.map((voice, index) => (
            <article key={voice.name} className="flex flex-col justify-between rounded-xl bg-[#fff8f5] p-6 shadow-sm">
              <div>
                <p className="mb-4 flex gap-1 text-[#7c2f1d]" aria-label="Cinco estrelas">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} />)}
                </p>
                <p className="text-[15px] leading-7 text-[#1e1b19] italic">“{voice.text}”</p>
              </div>
              <div className="mt-8 flex items-center gap-3 border-t border-[#eee7e3] pt-4">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8d2c8] font-medium text-[#7c2f1d]">{voice.mark}</span>
                <span>
                  <span className="block text-[18px] leading-6">{voice.name}</span>
                  <span className="text-[11px] font-semibold tracking-[0.1em] text-[#55433e] uppercase">{voice.role} · {voicePlaces[index] ?? 'São Paulo'}</span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="numeros" className="bg-[#faf2ee] px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-light tracking-tight sm:text-5xl">A edição em números</h2>
          <dl className="mx-auto mt-12 grid max-w-3xl gap-10 sm:grid-cols-2">
            <Stat value="140+" label="Na sua cidade" detail="A lista nasce onde você está. Lugar de outra capital não entra." />
            <Stat value="3 min" label="Até escolher" detail="Você conta o momento. Voltam lugares a que dá para ir, com o motivo." />
          </dl>
        </div>
      </section>

      <section className="bg-white px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#7c2f1d] uppercase">Circulação aberta e gratuita</p>
          <h2 className="mx-auto mt-3 max-w-[16ch] text-4xl leading-tight font-light tracking-tight sm:text-5xl">
            Pronto para viver {placeName === 'sua cidade' ? 'a cidade' : placeName} fora dos feeds genéricos?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-8 text-[#55433e]">
            Crie uma conta e volte aos lugares que combinaram com você.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register" className="inline-flex h-12 items-center rounded bg-[#1e1b19] px-8 text-[11px] font-semibold tracking-[0.14em] text-[#fff8f5] uppercase hover:bg-[#7c2f1d]">
              Criar conta gratuita
            </Link>
            <a
              href="#intencao"
              onClick={(event) => {
                event.preventDefault();
                goToSection('intencao');
              }}
              className="inline-flex h-12 items-center rounded bg-[#f4ece8] px-8 text-[11px] font-semibold tracking-[0.14em] text-[#1e1b19] uppercase"
            >
              Ver edição vigente
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#faf2ee] px-6 pt-16 pb-10">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="text-[22px]">
              Unbora <span className="ml-2 text-[11px] font-semibold tracking-[0.14em] text-[#7c2f1d] uppercase">Edição {placeName}</span>
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#55433e]">
              Guia independente de lugares, arquitetura cotidiana e cultura gastronômica, onde você estiver.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm md:col-span-3">
            <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-[#55433e] uppercase">Cadernos</p>
            {homeSections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  goToSection(section.id);
                }}
                className="hover:text-[#7c2f1d]"
              >
                {section.label}
              </a>
            ))}
          </div>
          <div className="text-sm text-[#55433e] md:col-span-4">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">Expediente</p>
            <p>Redigido a partir da cidade de quem lê.</p>
            <p className="mt-3">
              <Link to="/login" className="hover:text-[#7c2f1d]">Entrar</Link>
              <span className="mx-2">·</span>
              <Link to="/register" className="hover:text-[#7c2f1d]">Cadastrar</Link>
            </p>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-2 border-t border-[#e3dbd2] pt-4 text-[11px] font-semibold tracking-[0.1em] text-[#55433e] uppercase sm:flex-row">
          <p>© {new Date().getFullYear()} Unbora. Circulação aberta.</p>
          <p>Lugares do mapa. Foto do endereço quando ela existe.</p>
        </div>
      </footer>
    </div>
  );
}

function Principle({ index, title, text, foot }: { index: string; title: string; text: string; foot: string }) {
  return (
    <article className="flex flex-col justify-between rounded-xl bg-[#26221f] p-6">
      <div>
        <p className="text-[1.75rem] font-medium text-[#ffdad2]">{index}</p>
        <h3 className="mt-4 text-lg text-[#fff8f5]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-[#bfb3a4]">{text}</p>
      </div>
      <p className="pt-8 text-[11px] font-semibold tracking-[0.14em] text-[#8a7f72] uppercase">{foot}</p>
    </article>
  );
}

function Stat({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <div>
      <dt className="text-5xl font-light tracking-tight text-[#7c2f1d]">{value}</dt>
      <dd className="mt-1 text-lg">{label}</dd>
      <dd className="mt-1 text-sm leading-6 text-[#55433e]">{detail}</dd>
    </div>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1L3.2 9.4l6.1-.9L12 3z" />
    </svg>
  );
}
