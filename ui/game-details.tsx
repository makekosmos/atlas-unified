import { Image, signal, Text, View } from "nsh";
import { Input } from "nsh/base";
import { Button as SharedButton } from "@makekosmos/imago-nsh";
import type { ThemeColors } from "@makekosmos/imago-nsh";
import type { GameCard, MetadataChoice, MetadataChoices } from "./game-library";
import { Modal } from "./modal";

const imageSource = signal("");

function xml(text: string) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function placeholder(title: string) {
  const label = xml(title.trim().slice(0, 42) || "Игра");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="920" height="430" viewBox="0 0 920 430"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#18212f"/><stop offset=".55" stop-color="#493a70"/><stop offset="1" stop-color="#a65951"/></linearGradient></defs><rect width="920" height="430" fill="url(#g)"/><circle cx="780" cy="80" r="240" fill="#fff" opacity=".06"/><text x="46" y="350" fill="#fff" font-family="sans-serif" font-size="42" font-weight="600">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function Artwork(props: { title: string; path?: string | null; height?: number }) {
  const height = props.height ?? 215;
  return <Image src={props.path || placeholder(props.title)} style={{ width: "100%", height }} />;
}

function metadataStatus(card: GameCard) {
  if (card.metadataStatus === "loading") return "Метаданные загружаются…";
  if (card.metadataStatus === "not-found") return "Источник не нашёл метаданные — можно добавить картинку вручную";
  if (card.metadataStatus === "error") return "Не удалось загрузить метаданные";
  return "";
}

export function GameDetailsDialog(props: { card: GameCard; colors: ThemeColors; onClose: () => void; onSetImage: (source: string) => void }) {
  const genres = props.card.genres?.join(" · ") || "Жанры неизвестны";
  const developers = props.card.developers?.join(" · ") || "неизвестен";
  const publishers = props.card.publishers?.join(" · ") || "неизвестен";
  const footer = <View class="flex-row items-center justify-between" style={{ gap: 10 }}>
    <Input value={imageSource()} onChange={(value) => imageSource.set(value)} placeholder="URL или путь к картинке" accessibilityLabel="URL или путь к своей картинке" class="h-9 min-w-0 flex-1 rounded-lg px-3 text-[12px]" style={{ backgroundColor: props.colors.background, color: props.colors.foreground }} />
    <SharedButton label="Сохранить" colors={props.colors} onPress={() => { const source = imageSource().trim(); if (source) props.onSetImage(source); }} className="h-9 items-center justify-center px-3 py-0" />
  </View>;
  return <Modal title={props.card.title} colors={props.colors} onDismiss={props.onClose} width={520} footer={footer}>
    <Artwork title={props.card.title} path={props.card.headerImagePath} />
    <Text class="mt-3 text-[12px]" style={{ color: props.colors.muted }}>Разработчик: {developers} · издатель: {publishers}</Text>
    {metadataStatus(props.card) && <Text class="mt-1 text-[11px]" style={{ color: props.colors.muted }}>{metadataStatus(props.card)}</Text>}
    <Text class="mt-2 text-[12px]" style={{ color: props.colors.muted }}>{genres} · {props.card.releaseDateText || props.card.released || "дата выхода неизвестна"}</Text>
    {props.card.description && <Text class="mt-3 text-[12px] leading-[18px]" style={{ color: props.colors.foreground }}>{props.card.description}</Text>}
    <Text class="mt-3 text-[11px]" style={{ color: props.colors.muted }}>Можно вставить URL изображения или путь к локальному файлу.</Text>
  </Modal>;
}

export function MetadataChoicesDialog(props: { choices: MetadataChoices; colors: ThemeColors; onChoose: (choice: MetadataChoice) => void; onClose: () => void }) {
  return <Modal title={`Выбери версию игры: ${props.choices.title}`} colors={props.colors} onDismiss={props.onClose} width={520}>
    <Text class="mb-3 text-[12px]" style={{ color: props.colors.muted }}>Нашлось несколько похожих игр. Выбор привяжет подходящие метаданные.</Text>
    <View class="flex-col" style={{ gap: 8 }}>
      {props.choices.candidates.slice(0, 5).map((candidate) => <View onPress={() => props.onChoose(candidate)} role="button" accessibilityLabel={`Выбрать ${candidate.name}`} class="h-[76px] flex-row items-center overflow-hidden rounded-[10px] border px-2" style={{ gap: 10, borderColor: props.colors.border, backgroundColor: props.colors.background }}>
        <Image src={candidate.headerImagePath || placeholder(candidate.name)} style={{ width: 132, height: 62 }} />
        <Text class="min-w-0 flex-1 text-[13px]" style={{ color: props.colors.foreground }}>{candidate.name}</Text>
      </View>)}
    </View>
  </Modal>;
}
