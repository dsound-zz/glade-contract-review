/**
 * Sample contracts for one-click demos. These are surfaced in the UI so a
 * reviewer can evaluate the pipeline without hunting for a document to paste.
 *
 * They are intentionally engineered to exercise the full range of verdicts:
 *  - CloudSync MSA: a vendor-hostile SaaS agreement with many red flags,
 *    plus omitted clauses (indemnification, insurance) to exercise "missing".
 *  - Meridian NDA: a moderate mutual NDA — mostly acceptable, a couple of
 *    attention items.
 *  - Northstar MSA: a fairly balanced agreement to prove the tool does not
 *    simply flag everything.
 */
export type SampleContract = {
  key: string;
  title: string;
  counterparty: string;
  contractType: string;
  blurb: string;
  rawText: string;
};

export const SAMPLE_CONTRACTS: SampleContract[] = [
  {
    key: "cloudsync-msa",
    title: "CloudSync Master Subscription Agreement",
    counterparty: "CloudSync Technologies, Inc.",
    contractType: "SaaS Subscription",
    blurb: "Vendor-hostile SaaS terms — expect several critical flags.",
    rawText: `MASTER SUBSCRIPTION AGREEMENT

This Master Subscription Agreement ("Agreement") is entered into by and between CloudSync Technologies, Inc. ("CloudSync") and the customer identified in the applicable Order Form ("Customer").

1. SERVICES. CloudSync will make its cloud data-synchronization platform (the "Service") available to Customer pursuant to one or more Order Forms during the Subscription Term.

2. TERM AND RENEWAL. This Agreement commences on the Effective Date and continues for an initial term of twelve (12) months. Thereafter, the Agreement shall automatically renew for successive twelve (12) month periods unless either party provides written notice of non-renewal at least ninety (90) days prior to the end of the then-current term. Customer may not terminate this Agreement for convenience during any term.

3. FEES; PRICE CHANGES. Customer shall pay all fees set forth in the applicable Order Form. All fees are due upon receipt of invoice. CloudSync may increase fees for any renewal term at its then-current list pricing, without limitation. Late payments accrue interest at 1.5% per month.

4. DATA. Customer grants CloudSync a worldwide, perpetual, irrevocable license to access, use, host, copy, and analyze all data submitted to the Service ("Customer Data"), including the right to use Customer Data to develop, train, and improve CloudSync's products, services, and machine-learning models. CloudSync may retain Customer Data following termination for its internal purposes.

5. SECURITY. CloudSync will maintain commercially reasonable security measures. CloudSync is not required to notify Customer of any security incident unless required by applicable law, and any such notification will be provided within a reasonable time.

6. INTELLECTUAL PROPERTY. As between the parties, CloudSync owns all right, title, and interest in and to the Service and any data, reports, insights, or derivative works generated through the Service, including outputs derived from Customer Data.

7. WARRANTIES. THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." CLOUDSYNC DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. CloudSync does not warrant that the Service will be uninterrupted or error-free and offers no service-level commitment.

8. LIMITATION OF LIABILITY. IN NO EVENT SHALL CLOUDSYNC'S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT EXCEED THE FEES PAID BY CUSTOMER IN THE ONE (1) MONTH IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM. THIS LIMITATION APPLIES TO ALL CLAIMS, INCLUDING THOSE ARISING FROM DATA BREACH, LOSS OF DATA, AND INFRINGEMENT OF INTELLECTUAL PROPERTY.

9. CONFIDENTIALITY. Customer shall hold CloudSync's Confidential Information in strict confidence and shall not disclose it to any third party. This obligation survives termination for a period of one (1) year.

10. ASSIGNMENT. CloudSync may assign, transfer, or delegate this Agreement, in whole or in part, to any third party without notice to or consent from Customer. Customer may not assign this Agreement without CloudSync's prior written consent.

11. PUBLICITY. CloudSync may identify Customer as a customer and use Customer's name and logo in its marketing materials, website, press releases, and investor communications.

12. GOVERNING LAW; DISPUTES. This Agreement is governed by the laws of Singapore. Any dispute shall be finally resolved by binding arbitration seated in Singapore under the SIAC Rules. The prevailing party shall be entitled to recover its attorneys' fees and costs. Customer waives any right to participate in a class or representative action.

13. ENTIRE AGREEMENT. This Agreement constitutes the entire agreement between the parties and supersedes all prior understandings.`,
  },
  {
    key: "meridian-nda",
    title: "Mutual Non-Disclosure Agreement",
    counterparty: "Meridian Analytics LLC",
    contractType: "NDA",
    blurb: "A mutual NDA — mostly acceptable with a couple of attention items.",
    rawText: `MUTUAL NON-DISCLOSURE AGREEMENT

This Mutual Non-Disclosure Agreement ("Agreement") is made between Meridian Analytics LLC ("Meridian") and the counterparty signing below ("Recipient"), each a "Party."

1. PURPOSE. The Parties wish to explore a potential business relationship (the "Purpose") and in connection therewith may disclose to each other certain confidential and proprietary information.

2. CONFIDENTIAL INFORMATION. "Confidential Information" means any non-public information disclosed by one Party ("Discloser") to the other ("Recipient"), whether orally, in writing, or by inspection of tangible objects, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information.

3. EXCLUSIONS. Confidential Information does not include information that: (a) is or becomes public through no fault of the Recipient; (b) was rightfully known to the Recipient prior to disclosure; (c) is rightfully received from a third party without a duty of confidentiality; or (d) is independently developed without use of the Confidential Information.

4. OBLIGATIONS. Each Party agrees to (a) hold the other Party's Confidential Information in confidence, (b) use it solely for the Purpose, and (c) protect it using the same degree of care it uses for its own confidential information, but no less than a reasonable degree of care. The obligations in this Agreement are mutual and apply equally to both Parties.

5. TERM. This Agreement remains in effect for two (2) years from the Effective Date. The confidentiality obligations with respect to any Confidential Information disclosed during the term shall survive for a period of two (2) years following the date of disclosure.

6. RETURN OF MATERIALS. Upon the Discloser's written request, the Recipient shall promptly return or destroy all materials containing Confidential Information.

7. NO LICENSE. Nothing in this Agreement grants either Party any right or license under any patent, copyright, trademark, or trade secret of the other Party.

8. INJUNCTIVE RELIEF. Each Party acknowledges that a breach of this Agreement may cause irreparable harm for which monetary damages would be inadequate, and that the non-breaching Party shall be entitled to seek injunctive relief.

9. GOVERNING LAW. This Agreement shall be governed by the laws of the State of Delaware, without regard to its conflict-of-laws principles. The state and federal courts located in Delaware shall have exclusive jurisdiction.

10. NO WARRANTY. All Confidential Information is provided "as is." Neither Party makes any warranty as to the accuracy or completeness of its Confidential Information.

11. ENTIRE AGREEMENT. This Agreement supersedes all prior discussions and constitutes the entire agreement between the Parties concerning its subject matter.`,
  },
  {
    key: "northstar-msa",
    title: "Northstar Cloud Services Agreement",
    counterparty: "Northstar Cloud, Inc.",
    contractType: "SaaS Subscription",
    blurb: "A fairly balanced agreement — mostly acceptable, a few items to note.",
    rawText: `CLOUD SERVICES AGREEMENT

This Cloud Services Agreement ("Agreement") is entered into between Northstar Cloud, Inc. ("Provider") and the customer identified on the Order Form ("Customer").

1. SERVICES. Provider will provide the subscription services described in each Order Form (the "Services") in accordance with this Agreement and the Documentation.

2. TERM; TERMINATION. The initial term is set forth in the Order Form. The Agreement will renew for successive one-year terms unless either party gives written notice of non-renewal at least thirty (30) days before the end of the then-current term. Either party may terminate for the other party's material breach that remains uncured thirty (30) days after written notice. Customer may terminate for convenience on sixty (60) days' notice, subject to payment for the remainder of the then-current term.

3. FEES. Customer will pay the fees stated in the Order Form within thirty (30) days of the invoice date. Provider may increase fees upon renewal by no more than five percent (5%) over the prior term's fees.

4. DATA PROTECTION. The Data Processing Addendum attached as Exhibit A is incorporated by reference. Provider processes Customer Personal Data solely as a processor acting on Customer's documented instructions. Provider will notify Customer without undue delay, and in any event within seventy-two (72) hours, after becoming aware of a Personal Data Breach. Upon termination, Provider will delete or return Customer Data within thirty (30) days. Provider maintains a list of subprocessors and will provide advance notice of changes, allowing Customer to object.

5. SECURITY; INSURANCE. Provider maintains an information security program aligned to SOC 2 Type II. Provider will maintain cyber/technology errors-and-omissions insurance of not less than $5,000,000 per occurrence during the term.

6. INTELLECTUAL PROPERTY. Customer retains all right, title, and interest in and to Customer Data. Provider retains all right, title, and interest in and to the Services and its underlying technology. Provider may use aggregated and de-identified data to improve and benchmark the Services.

7. WARRANTY; SLA. Provider warrants that the Services will materially conform to the Documentation. Provider will use commercially reasonable efforts to make the Services available 99.9% of the time, measured monthly, and will issue service credits as set forth in the SLA as Customer's exclusive remedy for availability failures.

8. INDEMNIFICATION. Provider will defend Customer against any third-party claim that the Services infringe a U.S. patent, copyright, or trademark, and will indemnify Customer for damages finally awarded, provided Customer promptly notifies Provider and allows Provider to control the defense. Customer will defend Provider against third-party claims arising from Customer Data or Customer's unlawful use of the Services.

9. LIMITATION OF LIABILITY. Except for the excluded claims below, each party's aggregate liability arising out of this Agreement will not exceed the fees paid or payable by Customer in the twelve (12) months preceding the claim. The foregoing cap does not apply to (a) a party's indemnification obligations, (b) Provider's breach of its data-protection or confidentiality obligations, or (c) amounts owed under an Order Form; liability for (a) and (b) is capped at two times (2x) the twelve-month fees.

10. CONFIDENTIALITY. Each party will protect the other's Confidential Information with reasonable care and will not use or disclose it except as permitted here. These obligations are mutual and survive for three (3) years after termination, and for as long as any trade secret remains a trade secret.

11. ASSIGNMENT. Neither party may assign this Agreement without the other's prior written consent, except that either party may assign it to a successor in connection with a merger or sale of substantially all of its assets, upon written notice.

12. PUBLICITY. Provider may include Customer's name and logo in a customer list on its website. Any other use of Customer's marks requires Customer's prior written consent.

13. GOVERNING LAW. This Agreement is governed by the laws of the State of Delaware. The parties consent to the exclusive jurisdiction of the state and federal courts located in Delaware. Either party may seek injunctive relief in any court of competent jurisdiction.

14. ENTIRE AGREEMENT. This Agreement, including all Order Forms and exhibits, is the entire agreement between the parties.`,
  },
];
