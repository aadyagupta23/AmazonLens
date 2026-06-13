import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, Star, Zap, HelpCircle, ShoppingBag, Gift, List, Smartphone, User, Heart, Clock } from "lucide-react";

const PAGES = {
  "/orders": {
    Icon: Package,
    title: "Your Orders",
    subtitle: "No orders yet in this demo session.",
    detail: "In the full Amazon.in experience, all your purchases, tracking info, and return requests would appear here.",
    cta: "Start Shopping",
    ctaHref: "/",
  },
  "/prime": {
    Icon: Zap,
    title: "Amazon Prime",
    subtitle: "Unlimited free delivery, exclusive deals, and more.",
    detail: "Prime members get free same-day delivery, early access to lightning deals, Prime Video, Prime Music, and ad-free reading.",
    cta: "Browse Deals",
    ctaHref: "/deals",
  },
  "/help": {
    Icon: HelpCircle,
    title: "Customer Service",
    subtitle: "We're here to help.",
    detail: "For this demo, all backend flows are live — Auth, Search, Cart, and TrustLens. For full support features, visit the production Amazon.in.",
    cta: "Back to Home",
    ctaHref: "/",
  },
  "/sell": {
    Icon: ShoppingBag,
    title: "Sell on Amazon",
    subtitle: "Reach millions of customers across India.",
    detail: "Register as a seller, list your products, and start selling. Seller registration is part of the full Amazon.in platform.",
    cta: "Browse Products",
    ctaHref: "/",
  },
  "/gift-cards": {
    Icon: Gift,
    title: "Gift Cards",
    subtitle: "The perfect gift for everyone.",
    detail: "Amazon Gift Cards can be used to buy millions of items on Amazon.in. Available in the full platform.",
    cta: "Shop Instead",
    ctaHref: "/",
  },
  "/registry": {
    Icon: List,
    title: "Wish List & Registry",
    subtitle: "Create lists for any occasion.",
    detail: "Wedding lists, birthday wish lists, baby registries — all available in the full Amazon.in experience.",
    cta: "Back to Home",
    ctaHref: "/",
  },
  "/amazon-pay": {
    Icon: Zap,
    title: "Amazon Pay",
    subtitle: "Fast, secure checkout everywhere.",
    detail: "Amazon Pay lets you check out on thousands of sites using your Amazon account. Available in the full platform.",
    cta: "Back to Home",
    ctaHref: "/",
  },
  "/minitv": {
    Icon: Smartphone,
    title: "Amazon miniTV",
    subtitle: "Watch free shows, news, and videos.",
    detail: "Amazon miniTV offers free ad-supported streaming of web series, news, and short-form content. Available in the full Amazon.in app.",
    cta: "Back to Home",
    ctaHref: "/",
  },
  "/account": {
    Icon: User,
    title: "Your Account",
    subtitle: "Manage your profile and preferences.",
    detail: "Update your address, payment methods, notification settings, and more — available in the full Amazon.in platform.",
    cta: "Sign In",
    ctaHref: "/login",
  },
  "/wishlist": {
    Icon: Heart,
    title: "Your Wish List",
    subtitle: "Save items for later.",
    detail: "Add products to your wish list and share with friends and family. Available in the full Amazon.in experience.",
    cta: "Start Browsing",
    ctaHref: "/",
  },
  "/history": {
    Icon: Clock,
    title: "Browsing History",
    subtitle: "Items you've recently viewed.",
    detail: "Your recent product views are tracked in the full Amazon.in platform to personalize your recommendations.",
    cta: "See Recommendations",
    ctaHref: "/",
  },
};

export default function StubPage() {
  const { pathname } = useLocation();
  const page = PAGES[pathname] || {
    Icon: Star,
    title: "Coming Soon",
    subtitle: "This feature will be available soon.",
    detail: "This is part of the full Amazon.in experience.",
    cta: "Back to Home",
    ctaHref: "/",
  };
  const { Icon } = page;

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-sm p-10 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 bg-[#FFF3E0] rounded-full flex items-center justify-center mx-auto mb-5">
          <Icon size={28} className="text-[#FF9900]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F1111] mb-2">{page.title}</h1>
        <p className="text-[#565959] text-base mb-3">{page.subtitle}</p>
        <p className="text-sm text-[#565959] bg-[#F7F8F8] rounded-lg p-4 mb-6 text-left border border-gray-100">
          {page.detail}
        </p>
        <Link
          to={page.ctaHref}
          className="inline-block btn-primary px-8 py-2.5 rounded-full font-bold text-sm"
        >
          {page.cta}
        </Link>
      </div>
    </div>
  );
}
