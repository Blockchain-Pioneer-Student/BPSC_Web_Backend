import { BadRequestException } from '@nestjs/common';
import type { SiteContentKey } from './site-content.keys';

const SITE_CONTENT_FIELDS: Record<SiteContentKey, readonly string[]> = {
  branding: ['site_name', 'header_logo_url', 'footer_logo_url', 'logo_alt'],
  navigation: [
    'home_label', 'home_url', 'about_label', 'about_url',
    'events_label', 'events_url', 'news_label', 'news_url',
    'team_label', 'team_url', 'contact_label', 'contact_url',
    'join_label', 'join_url',
  ],
  home_hero: ['eyebrow', 'title', 'description', 'image_url', 'cta_label', 'cta_url'],
  home_intro: [
    'title', 'description',
    'feature_1_title', 'feature_1_description',
    'feature_2_title', 'feature_2_description',
    'feature_3_title', 'feature_3_description',
  ],
  home_events: ['title', 'view_all_label', 'view_all_url'],
  home_partners: ['title', 'view_all_label', 'view_all_url'],
  home_cta: ['title', 'description', 'primary_label', 'primary_url'],
  about_hero: ['title', 'subtitle', 'cta_label', 'cta_url', 'background_image_url'],
  about_mission: ['title', 'description', 'item_1', 'item_2', 'item_3', 'item_4'],
  about_vision: [
    'title', 'description',
    'stat_1_number', 'stat_1_label',
    'stat_2_number', 'stat_2_label',
    'stat_3_number', 'stat_3_label',
    'stat_4_number', 'stat_4_label',
  ],
  about_values: [
    'title',
    'value_1_title', 'value_1_description',
    'value_2_title', 'value_2_description',
    'value_3_title', 'value_3_description',
  ],
  about_journey: [
    'title',
    'item_1_year', 'item_1_title', 'item_1_description',
    'item_2_year', 'item_2_title', 'item_2_description',
    'item_3_year', 'item_3_title', 'item_3_description',
    'item_4_year', 'item_4_title', 'item_4_description',
    'item_5_year', 'item_5_title', 'item_5_description',
    'item_6_year', 'item_6_title', 'item_6_description',
  ],
  about_cta: [
    'title', 'description',
    'primary_label', 'primary_url',
    'secondary_label', 'secondary_url',
  ],
  team_hero: ['title', 'description', 'view_more_label', 'background_image_url'],
  events_page: [
    'hero_title', 'hero_description', 'background_image_url',
    'cta_title', 'cta_description',
    'primary_label', 'primary_url',
    'secondary_label', 'secondary_url',
  ],
  blogs_page: ['hero_title', 'hero_description', 'background_image_url'],
  join_hero: ['title', 'description'],
  join_benefits: [
    'title', 'description',
    'item_1_title', 'item_1_description',
    'item_2_title', 'item_2_description',
    'item_3_title', 'item_3_description',
  ],
  join_form: [
    'title', 'description', 'closed_title',
    'closed_description', 'submit_label',
  ],
  join_faq: ['title', 'q1', 'a1', 'q2', 'a2', 'q3', 'a3', 'q4', 'a4'],
  contact_hero: ['title', 'description'],
  contact_info: ['title', 'address', 'email', 'phone', 'connect_title'],
  contact_location: [
    'title', 'description', 'map_embed_url',
    'directions_label', 'directions_url',
  ],
  contact_faq: ['title', 'q1', 'a1', 'q2', 'a2', 'q3', 'a3', 'q4', 'a4'],
  footer: [
    'description', 'quick_links_title',
    'quick_about_label', 'quick_about_url',
    'quick_events_label', 'quick_events_url',
    'quick_news_label', 'quick_news_url',
    'quick_media_label', 'quick_media_url',
    'quick_partners_label', 'quick_partners_url',
    'quick_team_label', 'quick_team_url',
    'join_title', 'member_label', 'member_url',
    'faq_label', 'faq_url',
    'contact_link_label', 'contact_link_url',
    'contact_title', 'copyright_text',
  ],
  socials: ['facebook', 'linkedin', 'telegram', 'x', 'youtube'],
};

const LINK_FIELD_PATTERN = /(?:_url$|^(?:facebook|linkedin|telegram|x|youtube)$)/;
const SAFE_LINK_PATTERN = /^(?:#|\/(?!\/).*)$|^https?:\/\/.+/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s()-]{6,30}$/;
const MAX_FIELD_LENGTH = 10_000;

export function validateSiteContentValue(
  key: SiteContentKey,
  value: Record<string, unknown>,
): void {
  const allowedFields = new Set(SITE_CONTENT_FIELDS[key]);

  for (const [field, fieldValue] of Object.entries(value)) {
    if (!allowedFields.has(field)) {
      throw new BadRequestException(
        `Unsupported field "${field}" for site content key "${key}"`,
      );
    }

    if (typeof fieldValue !== 'string') {
      throw new BadRequestException(
        `Field "${field}" for site content key "${key}" must be a string`,
      );
    }

    if (fieldValue.length > MAX_FIELD_LENGTH) {
      throw new BadRequestException(
        `Field "${field}" exceeds the maximum length`,
      );
    }

    if (
      fieldValue.length > 0 &&
      LINK_FIELD_PATTERN.test(field) &&
      !SAFE_LINK_PATTERN.test(fieldValue)
    ) {
      throw new BadRequestException(
        `Field "${field}" must be an internal path, #, or an http(s) URL`,
      );
    }

    if (
      key === 'contact_info' &&
      field === 'email' &&
      fieldValue.length > 0 &&
      !EMAIL_PATTERN.test(fieldValue)
    ) {
      throw new BadRequestException('Contact email has an invalid format');
    }

    if (
      key === 'contact_info' &&
      field === 'phone' &&
      fieldValue.length > 0 &&
      !PHONE_PATTERN.test(fieldValue)
    ) {
      throw new BadRequestException('Contact phone has an invalid format');
    }
  }
}
