export type HomeGridItem = {
  id: string;
  type: "image" | "video";
  src: string;
};

export type HomeGrid = {
  templateId: string;
  /** Always exactly 5 items, in display order — position i renders into the template's cell i. */
  items: HomeGridItem[];
};

export type Brand = {
  id: string;
  name: string;
  image: string;
  active: boolean;
};

export type HomeData = {
  grid: HomeGrid;
  brands: Brand[];
};

export type ProfileItem = {
  id: string;
  name: string;
  designation: string;
  image: string;
};

export type AchievementItem = {
  id: string;
  title: string;
  image: string;
};

export type CompanyProfileTab =
  | { id: string; name: string; type: "text"; content: string }
  | { id: string; name: string; type: "profile"; items: ProfileItem[] }
  | { id: string; name: string; type: "achievement"; items: AchievementItem[] };

export type Product = {
  id: string;
  name: string;
  image: string;
};

export type Category = {
  id: string;
  name: string;
  products: Product[];
};

export type Pdf = {
  id: string;
  name: string;
  dataUrl: string;
};

export type InvestorItem = {
  id: string;
  name: string;
  pdfs: Pdf[];
};

export type MediaSection = {
  id: string;
  title: string;
  images: string[];
};

export type Message = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
  at: string;
};

export type SiteSettings = {
  logoUrl: string;
  companyName: string;
  companySubtitle: string;
  footerDescription: string;
  ourBrandText: string;
  /** Shown in both the footer's Address column and the Contact page. */
  contactAddress: string;
  /** Shown in both the footer's Address column and the Contact page. */
  contactPhone: string;
  /** Shown in both the footer's Address column and the Contact page. */
  contactEmail: string;
  /** Shown in the footer's Address column next to phone/email. Optional. */
  contactWebsite: string;
  /** Label for the pill button in the navbar, e.g. "Online Shop". */
  onlineShopLabel: string;
  /**
   * Destination for the navbar button — can be an outside/external site
   * (e.g. a marketplace or a separate shop domain) or an internal path.
   * When empty, the button is hidden from the navbar entirely.
   */
  onlineShopUrl: string;
};

// The Contact page's own wording. Its phone/email/address come straight
// from SiteSettings above (same values shown in the footer) so there's one
// place to update them; this type only covers what's specific to that page.
export type ContactPageContent = {
  heading: string;
  intro: string;
  formHeading: string;
};

export type AppData = {
  siteSettings: SiteSettings;
  home: HomeData;
  companyProfile: { tabs: CompanyProfileTab[] };
  brandsProducts: { categories: Category[] };
  investorRelation: { items: InvestorItem[] };
  media: { sections: MediaSection[] };
  contactPage: ContactPageContent;
  messages: Message[];
};