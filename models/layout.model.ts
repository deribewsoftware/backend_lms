import { Document, Schema, model } from "mongoose";

interface FaqItem extends Document{
  question: string;
  answer: string;
}

interface Category extends Document{
  title: string;
}

interface BannerImage extends Document{
  public_id: string;
  url: string;
}

interface Layout extends Document{
  type: string;
  faq:FaqItem[];
  category:Category[];
  banner:{
    Image:BannerImage;
    title: string;
    subTitle: string;
  }
}

const faqItemsShema=new Schema<FaqItem>({
  question:{
    type: String
  },
  answer:{
    type: String
  }
})

const categorySchema=new Schema<Category>({
  title:{
    type: String
  }
});

const bannerImageSchema=new Schema<BannerImage>({
  public_id:{type: String},
  url:{type: String}
});

const layoutSchema=new Schema<Layout>({
  type:{
    type: String
  },
  faq:[faqItemsShema],
  category:[categorySchema],
  banner:{
    Image:bannerImageSchema,
    title:{type: String},
    subTitle:{type: String}
  }
});
const layoutModel=model<Layout>("Layout", layoutSchema);
export default layoutModel;