/**
 * PrivacyPolicy.tsx
 * 
 * Legally sound and GDPR/COPPA-compliant Privacy Policy designed for Google Play Store publication.
 */
import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Shield, Lock, Eye, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const { language } = useAuth();

  const labels = {
    en: {
      title: "Privacy Policy",
      subtitle: "Last Updated: June 2026",
      desc: "Your privacy is of paramount importance to us. This document outlines the types of personal information we collect, record, and how we protect it in compliance with GPDR/COPPA guidelines.",
      collect: "1. Information We Collect",
      collectBody: "When registering or signing in through Google, we process your email address, display name, and profile photos solely to manage scores and global learning standings. Offline performance data remains strictly inside your local device cache.",
      cookies: "2. AdMob & Analytics Tracking",
      cookiesBody: "We utilize Google AdMob services to serve light, context-aware student ads. Google may use advertising identifiers to serve personalized ads based on interests while respecting COPPA restrictions.",
      retention: "3. Retention & Data Erasure",
      retentionBody: "Your gamified learning checkpoints (XP, level milestones, streaks) are stored in secure sandboxed systems. You may request absolute removal of your data at any time by contacting our support desk or deleting your profile.",
      safe: "4. Child Safety Compliance",
      safeBody: "We do not intentionally target minors under age 13 with tracking. All children's features are designed with safe parameters keeping content clean, authentic, and scholastic.",
      contact: "Have Questions?",
      contactBody: "For privacy questions, access queries or absolute account wipes, coordinate with legal@kurdishquest.com",
      back: "Dashboard"
    },
    ar: {
      title: "سياسة الخصوصية",
      subtitle: "آخر تحديث: يونيو 2026",
      desc: "خصوصيتك ذات أهمية بالغة لدينا. توضح هذه الوثيقة أنواع البيانات الشخصية التي نقوم بجمعها، معالجتها، وحمايتها تماشياً مع معايير اللائحة العامة لحماية البيانات (GDPR).",
      collect: "١. البيانات التي نجمعها",
      collectBody: "عند تسجيل الدخول بواسطة غوغل، نقوم فقط بحفظ اسمك وصورتك الشخصية والبريد الإلكتروني لتشغيل لوحة الصدارة وحفظ نقاط الخبرة (XP). بينما تبقى نتائج التعلم الأخرى محفوظة محلياً على جهازك.",
      cookies: "٢. شراكة الإعلانات AdMob",
      cookiesBody: "نحن نستخدم خدمات Google AdMob لعرض الإعلانات المدرسية القصيرة. قد تستخدم غوغل معرفات الهواتف لدعم الإعلانات المخصصة والمحتوى التعليمي.",
      retention: "٣. حقوق مسح البيانات",
      retentionBody: "يتم تخزين تقدمك التعليمي وسجل مشاركاتك بشكل آمن. يمكنك طلب حذف حسابك وبياناتك فوراً عن طريق التواصل بمركز الدعم الفني.",
      safe: "٤. حماية القاصرين والأطفال",
      safeBody: "جميع محتوياتنا آمنة وتعليمية بشكل كلي لجميع الأعمار ولا نهدف إلى تتبع الأطفال دون سن ١٣ عاماً بشكل مباشر.",
      contact: "هل لديك استفسار؟",
      contactBody: "إذا كنت ترغب بمسح بياناتك بشكل كامل، تفضل بمراسلة الفريق البرمجي: legal@kurdishquest.com",
      back: "الرئيسية"
    }
  }[language !== 'ar' ? 'en' : 'ar'];

  return (
    <div className="p-5 max-w-md mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 text-slate-800 dark:text-slate-200 select-none">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{labels.title}</h2>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{labels.subtitle}</p>
        </div>
      </div>

      <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/30 p-4 rounded-3xl mb-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex items-start gap-3">
        <Shield className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <p>{labels.desc}</p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-3xl space-y-1 text-start">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>{labels.collect}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {labels.collectBody}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-3xl space-y-1 text-start">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>{labels.cookies}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {labels.cookiesBody}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-3xl space-y-1 text-start">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
            <CheckCircle className="w-4 h-4" />
            <span>{labels.retention}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {labels.retentionBody}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-4 rounded-3xl space-y-1 text-start">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>{labels.safe}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {labels.safeBody}
          </p>
        </div>

        <div className="border border-slate-200 dark:border-slate-800/40 p-4 rounded-3xl space-y-1 text-start bg-slate-100 dark:bg-slate-900">
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">{labels.contact}</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            {labels.contactBody}
          </p>
        </div>

      </div>

    </div>
  );
}
