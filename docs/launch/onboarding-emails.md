Sent by: Kaira, by email. The confirmation email goes out automatically from Supabase Auth at sign-up; the other three are sent by the owner by hand (or by a scheduled job later) at the times noted on each template.

# Onboarding emails

## Notes for the owner

- Email 1 is a Supabase Auth template. Paste it into Supabase, Authentication, Email Templates, "Confirm signup". Keep the `{{ .ConfirmationURL }}` tag exactly as written. It only applies once the backend is live. In single-device mode no confirmation email is sent.
- Emails 2 to 4 are plain text, ready for Gmail or a transactional email tool. Replace `[First name]`, `[Listing title]` and `[reply address]`.
- Kaira does not yet send the "first view" email on its own. Until it does, send it by hand when you see a tester's listing reach its first view in the admin dashboard.
- British spelling throughout. Prices as K30, never ZMW 30.

---

## 1. Confirm your email

**When:** immediately after sign-up (automatic).
**Subject:** Confirm your email for Kaira
**Preview text:** One tap and you're in.

Hi,

Welcome to Kaira. Tap the link below to confirm your email and finish signing up.

{{ .ConfirmationURL }}

The link brings you straight back to Kaira. If you did not create an account, you can ignore this email and nothing will happen.

Kaira
Buy and sell across Zambia. Kaira connects buyers and sellers and never handles the payment.

---

## 2. Welcome

**When:** the same day as the first sign-in, within a few hours.
**Subject:** Welcome to Kaira, [First name]
**Preview text:** Here is how to get the most out of your first week.

Hi [First name],

You're in. Here is what Kaira does and how to start.

**Browse by category.** Vehicles, Property, Electronics, Furniture, Fashion, Sports, Collectibles, Pets, Boats, Motorcycles, Jobs, Services, Business and Other. Each category has its own filters, so a car search asks about make and mileage and a house search asks about bedrooms.

**Search in plain words.** Type something like "3 bedroom house to rent in Ndola" and Kaira turns it into filters for you.

**Save what you like.** Tap the heart on any listing. Save a search too and Kaira keeps it for you under Saved.

**Message sellers.** Every listing has a Message button. You can send an offer from inside the chat.

**Sell in four steps.** Tap Sell. Choose a plan, add photos, fill in the details, review and publish. Mahala is free and gives you everything you need to sell. Premium (K30, or K80 for vehicles, property and business) puts your listing higher in search for 45 days. Gold (K75, or K200 for vehicles, property and business) gives top placement and homepage exposure for 60 days. All prices include 16% VAT.

One thing we want to be clear about from day one: Kaira never handles the payment between buyer and seller. You settle however you both agree, whether MoMo, bank transfer or cash in person. Meet in a public place for anything valuable.

Open Kaira: https://kaira-jolezya-s-projects.vercel.app

If anything is unclear, reply to this email. A real person reads it.

The Kaira team

---

## 3. First-listing nudge (day 2)

**When:** two days after sign-up, only to people who have not published a listing.
**Subject:** Your first listing takes about three minutes
**Preview text:** Everyone has something they could sell this week.

Hi [First name],

Most people have something at home they no longer use. A phone in a drawer. A chair. A bicycle. Someone in your town is looking for it.

Listing on Kaira takes about three minutes:

1. Tap **Sell**.
2. Choose **Mahala**. It is free and gives you a complete listing for 30 days with up to 8 photos.
3. Add photos. Good light, plain background, the item on its own.
4. Type a title. Tap the AI button and Kaira drafts the description and suggests a price from similar listings. Edit anything you like.
5. Set your location and publish.

Buyers in your town see your listing first. When someone messages you, the notification arrives in Kaira.

If you get halfway and need to stop, tap Save draft. Your draft waits for you under your profile.

Open Kaira: https://kaira-jolezya-s-projects.vercel.app

Reply if anything gets in your way. We fix things fast at this stage.

The Kaira team

---

## 4. Your listing got its first view

**When:** the first time a listing's view count goes from 0 to 1. Send once per seller, not once per listing.
**Subject:** Someone just looked at your [Listing title]
**Preview text:** Your first view on Kaira. Here is how to turn views into messages.

Hi [First name],

Someone has just opened your listing for [Listing title]. That is your first view on Kaira.

Three small things that turn views into messages:

**Lead with your best photo.** The first photo is the one buyers see in search. On the listing, tap the star on a photo to make it the cover.

**Answer fast.** Buyers usually message several sellers. The first reply often wins.

**Price with confidence.** If you are open to offers, say so in the description. Buyers can send an offer from the chat and you can accept or counter.

Want more eyes on it? From your listing you can upgrade to Premium or add a Boost without starting again. A 3-day Boost is K30 for everyday items and K60 for vehicles, property and business, and lifts your listing to the top of search. Prices include 16% VAT.

See your views under your profile, on the listing itself.

Open Kaira: https://kaira-jolezya-s-projects.vercel.app

The Kaira team
