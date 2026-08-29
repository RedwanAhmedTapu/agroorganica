import { AppData } from "./types";
import { placeholder, uid } from "./helpers";

export function makeSeedData(): AppData {
  return {
    siteSettings: {
      logoUrl: "", // empty = fall back to the default Leaf icon mark in the navbar/footer
      companyName: "Agro Organica",
      companySubtitle: "Nurture Nature",
      footerDescription:
        "Contract farming, trading, processing and manufacturing — carrying wholesome products from Bangladesh to homes across the world.",
      ourBrandText:
        '"Khusboo" carries close to 100 product varieties into homes across all 64 districts of Bangladesh and beyond.',
      contactAddress: "Elephant Road, Dhaka, Bangladesh",
      contactPhone: "+880 1XXX-XXXXXX",
      contactEmail: "info@agroorganica.com",
    },
    home: {
      grid: {
        templateId: "spotlight",
        items: [
          { id: uid(), type: "image", src: placeholder("01", "#3f6b52") },
          { id: uid(), type: "image", src: placeholder("02", "#c99a3e", "#26302b") },
          { id: uid(), type: "image", src: placeholder("03", "#c9506b") },
          { id: uid(), type: "image", src: placeholder("04", "#4c7c59") },
          { id: uid(), type: "image", src: placeholder("05", "#b98fc9") },
        ],
      },
      brands: [
        { id: uid(), name: "Khusboo", image: placeholder("KH", "#1f4b3f"), active: true },
        { id: uid(), name: "Agro Organica", image: placeholder("AO", "#c99a3e", "#26302b"), active: true },
        { id: uid(), name: "Sherpur Fresh", image: placeholder("SF", "#4c7c59"), active: true },
        { id: uid(), name: "Nature's Pantry", image: placeholder("NP", "#c9506b"), active: false },
      ],
    },
    companyProfile: {
      tabs: [
        {
          id: "about",
          name: "About Us",
          type: "text",
          content:
            "Agro Organica is a public limited company registered in Bangladesh, working since 2015 across contract farming, trading, processing and manufacturing for local and global markets.\n\nOur factory sits in the BSCIC industrial area of Sherpur, with a central warehouse in Dhaka and a head office on Elephant Road. Close to 200 people work across the business to serve customers at home and abroad.\n\nWe aim to cut post-harvest losses, diversify products and connect growers directly with consumers, while protecting nutritional value through modern packaging. Our brand \"Khusboo\" carries close to 100 product varieties into homes across all 64 districts of Bangladesh and a growing number of countries beyond.",
        },
        {
          id: "board",
          name: "Board of Directors",
          type: "profile",
          items: [
            { id: uid(), name: "Mohammad Ahmed Khan", designation: "Chairman", image: placeholder("MK") },
            { id: uid(), name: "Mohammad Azhar Khan", designation: "Managing Director", image: placeholder("MA") },
            { id: uid(), name: "Md. Iqbal Hossain", designation: "Director", image: placeholder("IH") },
          ],
        },
        {
          id: "kmp",
          name: "Key Management Personnel",
          type: "profile",
          items: [
            { id: uid(), name: "Farida Yasmin", designation: "Chief Financial Officer", image: placeholder("FY") },
            { id: uid(), name: "Rashedul Islam", designation: "Head of Operations", image: placeholder("RI") },
          ],
        },
        {
          id: "achievements",
          name: "Achievements",
          type: "achievement",
          items: [
            { id: uid(), title: "Best Emerging Agro Brand — 2021", image: placeholder("21", "#c99a3e", "#26302b") },
            { id: uid(), title: "Export Excellence Award — 2023", image: placeholder("23", "#c99a3e", "#26302b") },
          ],
        },
      ],
    },
    brandsProducts: {
      categories: [
        {
          id: "rice",
          name: "Rice",
          products: [
            { id: uid(), name: "Basmati", image: placeholder("BA", "#caa53d") },
            { id: uid(), name: "Kalijira", image: placeholder("KA", "#b98fc9") },
          ],
        },
        { id: "dairy", name: "Dairy", products: [{ id: uid(), name: "Ghee", image: placeholder("GH", "#e8d38a", "#26302b") }] },
        { id: "pickle", name: "Pickle", products: [{ id: uid(), name: "Mango Pickle", image: placeholder("MP", "#c96b3d") }] },
        { id: "jelly", name: "Jelly", products: [{ id: uid(), name: "Mixed Fruit Jelly", image: placeholder("FJ", "#c9506b") }] },
        { id: "herbs", name: "Herbs", products: [{ id: uid(), name: "Tulsi Leaves", image: placeholder("TL", "#4c7c59") }] },
        { id: "spice", name: "Spice", products: [{ id: uid(), name: "Turmeric Powder", image: placeholder("TP", "#d99a2b") }] },
      ],
    },
    investorRelation: {
      items: [
        { id: uid(), name: "Annual Report", pdfs: [] },
        { id: uid(), name: "Financial Statements", pdfs: [] },
      ],
    },
    media: {
      sections: [
        {
          id: uid(),
          title: "Dhaka International Trade Fair — 2016",
          images: [
            placeholder("01", "#c9506b"),
            placeholder("02", "#4c7c59"),
            placeholder("03", "#caa53d"),
            placeholder("04", "#3f6b52"),
          ],
        },
        {
          id: uid(),
          title: "Foodex Saudi — 2019",
          images: [placeholder("05", "#b98fc9"), placeholder("06", "#c96b3d")],
        },
      ],
    },
    messages: [],
  };
}
