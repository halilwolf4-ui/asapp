# Asapp — Tablet İçin Tipografi Odaklı Hedef & Görev Yöneticisi

> ⚠️ **ÖNEMLİ ÇALIŞTIRMA NOTU:**  
> Bu proje modern bir **React + TypeScript + Vite** uygulamasıdır. `Live Server` benzeri düz statik dosya sunucuları veya `index.html` dosyasına doğrudan çift tıklayarak açmak **ÇALIŞMAZ (boş ekran ve 404 hatası verir)**.  
> Uygulamayı çalıştırmak için aşağıdaki adımları takip ediniz.

---

## 🚀 Nasıl Çalıştırılır?

### 1. Geliştirme (Development) Modu
Aynı yerel ağdaki (Wi-Fi) iPad veya Android tabletinizden de bağlanabilmeniz için `server.host: true` olarak yapılandırılmıştır:
```bash
# 1. Bağımlılıkları yükleyin (ilk seferde)
npm install

# 2. Geliştirme sunucusunu başlatın
npm run dev
```
Terminalde çıkan adresi tarayıcınızda açın:
- **Bilgisayarınızda:** `http://localhost:3000`
- **Tabletinizde:** Terminalde listelenen ağ adresi (örn. `http://192.168.1.XX:3000`)

---

### 2. Üretim Önizleme (Production Preview) Modu
Derlenmiş tam PWA paketini test etmek için:
```bash
# Projeyi derleyin ve önizleme sunucusunu başlatın
npm run build && npm run preview
```
- Tarayıcınızda `http://localhost:4173` adresine gidiniz.

---

### 3. Birim Testleri Çalıştırma
```bash
npm test
```

---

## 🎨 Tasarım Sistemi & Token'lar

Tasarım sistemi CSS Değişkenleri (Design Tokens) ve Tailwind CSS üzerine kuruludur:

- **Renk Token'ları**: `src/index.css`
  - Ana koyu arka plan: `--color-bg-deep` (`#0D133D`)
  - Yüzey & kart tonları: `--color-bg-surface` (`#141B4E`), `--color-bg-card` (`#1B2464`)
  - Pembe-Mercan (seçili pill / birincil aksiyon): `--color-accent-pink` (`#FF3D7F`)
  - Mint-Turkuaz (tamamlanma / ilerleme): `--color-accent-mint` (`#2EE6B6`)
  - Sarı ve Mor gradient vurucuları: `--color-accent-yellow` (`#FFC038`), `--color-accent-purple` (`#8A4FFF`)
- **Display Tipografi**: `tailwind.config.js`
  - Başlıklar: `'Outfit'` (Display devasa puntolar, `clamp()` fluid tipografi)
  - Gövde metinleri: `'Plus Jakarta Sans'`

---

## 📁 Proje Klasör Mimarisi

```
asapp/
├── public/
│   ├── favicon.svg            # Asapp 'A' monogram vektör logosu
│   ├── manifest.json          # PWA yapılandırması
│   ├── pwa-192x192.png        # PWA simgesi (192px)
│   ├── pwa-512x512.png        # PWA simgesi (512px)
│   └── maskable-icon-512x512.png # Tablet / Android adaptif maskable simge
├── src/
│   ├── types/                 # Horizon, Item, Category, CalculatedItem tipleri
│   ├── constants/
│   │   ├── categories.ts      # Kariyer, Sağlık, Kişisel, Finans vb.
│   │   └── seedData.ts        # 5Y -> 1Y -> 1M -> 1W -> Günlük Türkçe örnek veri
│   ├── services/storage/
│   │   ├── storageRepository.ts      # StorageRepository arayüzü & asapp: anahtarları
│   │   └── storageRepository.test.ts # Otomatik miras veri göçü testleri
│   ├── utils/
│   │   ├── dateUtils.ts              # date-fns Türkiye yerel ayarı
│   │   ├── progressCalculator.ts     # Özyinelemeli hiyerarşik ilerleme motoru
│   │   ├── progressCalculator.test.ts# İlerleme birim testleri
│   │   └── taskMovementAndProgress.test.ts # Sürükle-bırak & taşıma sonrası yeniden hesap testleri
│   ├── store/
│   │   └── usePlannerStore.ts        # Zustand durum yönetimi (Açılış: Bugün ekranı)
│   ├── components/
│   │   ├── common/
│   │   │   ├── AmbientBackground.tsx # Akıcı, organik gradient dalga animasyonları
│   │   │   └── Navigation.tsx        # "Asapp." tablet dikey & yatay navigasyonu
│   │   ├── views/
│   │   │   ├── TodayView.tsx         # Monumental tarih tipografisi & bugünün odağı
│   │   │   ├── WeekView.tsx          # dnd-kit sürükle-bırak haftalık sütunlar
│   │   │   ├── MonthView.tsx         # Ay takvimi & seçili gün panelinden günden güne sürükleme
│   │   │   ├── YearView.tsx          # 12 ay mini ısı haritası & yıllık stratejiler
│   │   │   ├── FiveYearView.tsx      # 5 yıllık vizyonlar ve zaman çizelgesi sütunları
│   │   │   └── GoalsView.tsx         # Hiyerarşik hedef ağacı & zincirleme ilerleme
│   │   ├── modals/ItemModal.tsx      # Akıllı varsayılanlı görev ekleme & düzenleme
│   │   └── stats/StatsDrawer.tsx     # İstatistikler, seri ve JSON tam yedekleme
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── vite.config.ts                     # PWA, devOptions ve tablet Wi-Fi host ayarları
└── package.json                       # Proje metadata ("asapp")
```
