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
  /** Second homepage logo strip ("Our Brand Partners") — same shape as
   * `brands` above, scrolls as a two-row marquee instead of the single
   * strip used for `brands`. */
  partnerBrands: Brand[];
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

// Brands & Products is a tree of unlimited depth — admin can nest a
// category inside a category inside a category, as many levels as they
// want (e.g. Dairy -> Milk Added Drink -> Flavoured Milk -> Mango Milk).
// A node with `children` is browsed like a folder; a node with an empty
// `children` array is a leaf and is shown as a plain product card.
export type ProductNode = {
  id: string;
  name: string;
  image: string;
  children: ProductNode[];
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
  brandsProducts: { categories: ProductNode[] };
  investorRelation: { items: InvestorItem[] };
  media: { sections: MediaSection[] };
  contactPage: ContactPageContent;
  messages: Message[];
};