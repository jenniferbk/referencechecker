# Model A/B Accuracy Report

_Generated 2026-05-26T21:19:47.547Z_

## Summary

| model                  | overall | verified | corrected | hallucinated | fix✓(approx) | unknown | false-acc | misses | avg-lat | tokens |
|------------------------|---------|----------|-----------|--------------|--------------|---------|-----------|--------|---------|--------|
| gemini-3.1-pro-preview | 76.7%   | 40.0%    | 90.0%     | 100.0%       | 100.0%       | 1       | 1         | 0      | 20597ms | 149644 |
| gemini-3.5-flash       | 71.7%   | 35.0%    | 85.0%     | 95.0%        | 100.0%       | 4       | 1         | 0      | 17133ms | 166285 |

## Verdict

- **Both models: 0 misses** — neither ever passed a fabricated reference off as real (the key safety metric for a citation checker).
- **3.1-pro leads overall (76.7% vs 71.7%)**, but the gap is reliability, not judgment: 3.5-flash returned **4 malformed/empty JSON responses vs 1**. On parseable output its verdicts tracked 3.1-pro closely (corrected 85 vs 90, hallucinated 95 vs 100).
- **Verified-bucket accuracy (40%/35%) is not a clean model-quality signal**: 11/20 "verified" items were marked "corrected" by *both* models because they apply APA rules the CrossRef→APA answer key doesn't (e.g. italicizing species names in titles); item v4 is a messy 1935 record both reasonably distrusted. The trustworthy signals are the corrected and hallucinated buckets.
- **3.5-flash is ~17% faster** (17.1s vs 20.6s) and cheaper per token, but more verbose (166k vs 150k tokens).
- **Recommendation:** do not switch to 3.5-flash on accuracy grounds yet. If cost/speed motivate it, first harden JSON handling (prompt + parse-failure retry) and re-run `npm run eval`.

## gemini-3.1-pro-preview

- Overall accuracy: **76.7%** (46/60)
- False accusations (real → flagged fake): **1**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 18/18
- Unknown/failed verdicts: 1

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 8        | 11        | 1            | 0       |
| corrected         | 0        | 18        | 1            | 1       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (14)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - notes: The source exists. Corrected the author's name from '郝, 慧' to the actual author's full name '郝慧敏' (and removed the comma, which is the standard convention when formatting Chinese names in Chinese APA style). The journal name, volume, issue, page number, and DOI are correct.
- **v4** truth=`verified` predicted=`hallucinated`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: Searches for the DOI 10.1007/bf02201120 and the specific combination of authors in the 1935 volume of De Economist yielded no results. While 'De Economist' is a real journal published by Springer (which uses the 10.1007 prefix) and J.M.E.M.A. Zonnenberg is a real Dutch author active in that era, this specific publication, page range, and DOI do not exist and appear to be fabricated by an AI.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: The reference exists. However, APA 7th edition does not use 'No' or 'Vol' before the volume and issue numbers. The format '*No 26*(2)' was corrected to '*26*(2)'.
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: Verified that the paper exists. The primary correction was changing the authors' surnames from ALL CAPS to Title Case, as APA 7th Edition requires only the first letter of the surname to be capitalized.
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: The reference is real, but there was a minor punctuation error. According to APA 7th edition rules, if an article title ends with a question mark or exclamation mark, you should not add an additional period after it. The extra period was removed.
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*(Suppl. 3), A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - notes: The reference exists. The formatting was corrected by adding the missing supplement number '(Suppl. 3)' immediately after the italicized volume number, which is required by APA 7th Edition rules for articles published in journal supplements. The rest of the reference is correctly formatted.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - notes: Verified the source as a book review published in the journal Antiquity. The original reference incorrectly included extraneous publication metadata (publisher, pages, price) as the article title, which is common in database exports but incorrect for APA 7. Corrected to the standard APA 7 format for an untitled book review by replacing the metadata with a bracketed description, and applied markdown italics to the book title, journal title, and volume number.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования, 97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: Verified that the source exists. Corrected extraneous punctuation in the authors' names (removed the stray commas and dots). Changed the journal title from ALL CAPS to sentence case, which is the standard capitalization for Russian publications and required by APA 7 for non-English sources. Adjusted markdown italics so that the comma after the journal title and the volume number are continuously italicized.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C., Nadur, M. A., Almeida, P. P. S., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. F. (2025). Cell protector, cobalt, and molybdenum in association with *Bradyrhizobium* and *Azospirillum* in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The reference was verified but required formatting corrections. The journal title was changed from ALL CAPS to Title Case (*Observatório de la Economía Latinoamericana*). The bacterial genus names in the article title (*Bradyrhizobium* and *Azospirillum*) were italicized as per APA 7 guidelines. Finally, the capitalized 'D.' initials representing the Portuguese preposition 'de' were removed from the authors' names, as they are standardly omitted from initials in APA.
- **v17** truth=`verified` predicted=`corrected`
  - ref: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - model correction: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, Article 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - notes: Verified existence of the article. Added the word 'Article' before the article number, which is required by APA 7th Edition rules for journals that use article numbers instead of page ranges.
- **v18** truth=`verified` predicted=`corrected`
  - ref: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - model correction: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wall of mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - notes: Verified the source exists. Corrected a typographical error in the article title ('wallof' to 'wall of'). The rest of the APA 7th formatting, including sentence case for the article title and italics for the journal name and volume number, is perfectly preserved.
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). «En camino hacia una meta santa: Ser prolongadores de la misión»: A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios Sobre los Ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: The reference exists, but it was missing the full subtitle of the article ('A propósito de la homilía...'). Additionally, APA 7th edition requires sentence case for the article title (capitalizing the first word after the colon/subtitle) and Title Case for the journal name.
- **c11** truth=`corrected` predicted=`unknown`
  - ref: Hoang-Khang Du, & Hai-Ninh Do (2023). Sequential mediation analysis of workplace bullying, work-life conflict, and young employees’ outcomes in Vietnam. Asian Academy of Management Journal, 28(2), 61–86. https://doi.org/10.21315/aamj2023.28.2.3
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: The reference could not be found and appears to be hallucinated. While the DOI structure mimics genuine articles from the Journal of the Illuminating Engineering Institute of Japan on J-STAGE, Volume 81 was actually published in 1997, not 1999 (which was Volume 83). Furthermore, searches for the specific DOI, authors, and title yielded zero results.

## gemini-3.5-flash

- Overall accuracy: **71.7%** (43/60)
- False accusations (real → flagged fake): **1**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 17/17
- Unknown/failed verdicts: 4

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 7        | 11        | 1            | 1       |
| corrected         | 1        | 17        | 0            | 2       |
| hallucinated      | 0        | 0         | 19           | 1       |

### Disagreements with truth (17)

- **v0** truth=`verified` predicted=`unknown`
  - ref: Aliyi, A. A., Ketaro, M. K., Engida, Z. T., Argaw, A. M., Muhammed, A. H., Hassen, M. M., Abduletif, A. M., Shiferaw, D. S., Wodera, A. L., Ayene, S. H., Esmael, J. K., & Etu, E. S. (2022). Risk perception, community myth, and practices towards COVID-19 pandemic in Southeast Ethiopia: Community based crossectional study. *PLOS ONE*, *17*(10), e0275331. https://doi.org/10.1371/journal.pone.0275331
  - notes: Raw Response: {
  "status": "corrected",
  "corrected": "Aliyi, A. A., Ketaro, M. K., Engida, Z. T., Argaw, A. M., Muhammed, A. H., Hassen, M. M., Abduletif, A. M., Shiferaw, D. S., Wodera, A. L., Ayene, S. H., Esmael, J. K., & Etu, E. S. (2022). Risk perception, community myth, and practices towards COVID-19 pandemic in Southeast Ethiopia: Community based crossectional study. *PLOS ONE*, *17*(10), Article e0275331. https://doi.org/10.1371/journal.pone.0275331",
  "notes": "The citation has been verified and corrected to include the word 'Article' before the article number (e0275331) to adhere strictly to APA 7th Edition style rules for online-only journals using e-locators."
ators."
."
."
."
 instead of page ranges."
}
- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177–178. https://doi.org/10.26549/fm.v1i2.353
  - notes: Verified the article exists. The following corrections were made: 1) The author's name was corrected from '郝, 慧' to '郝慧敏' (standard APA 7th style for Chinese-language references keeps the full name intact without a comma; if a Westernized surname-comma-given-name format is strictly required, it should be '郝, 慧敏'). 2) The page range was corrected from the single page '177' to '177–178' using an en-dash.
- **v4** truth=`verified` predicted=`hallucinated`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: The reference is hallucinated. The DOI (10.1007/bf02201120) does not exist, and there is no record of a co-authored publication or book review ('Boekbespreking') by 'Th. L.' and 'J. M. E. M. A. Zonnenberg' in De Economist (1935). While both individuals independently wrote reviews for the journal during that era, they did not publish this joint work.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: The source was successfully verified to exist. The reference was corrected to comply with APA 7th Edition standards by removing the 'No' label from the volume/issue section. In APA 7th, only the volume number (26) is italicized, followed immediately by the issue number in parentheses (2) in plain text.
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The reference is real and correct, but the authors' surnames were written in ALL CAPS. In APA 7th Edition, author names should use standard title/sentence-case capitalization (e.g., 'Morris, A.' instead of 'MORRIS, A.').
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/S0164-0704(02)00013-7
  - notes: Removed the extra period after the question mark in the article title, as APA 7th Edition style dictates that a question mark or exclamation point replaces the terminal period. Also, capitalized the 'S' in the DOI alphanumeric identifier for exactness.
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65: The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer [Abstract]. *International Journal of Gynecological Cancer*, *31*(Suppl. 3), A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - notes: The source exists and was verified as a conference abstract published in a journal supplement. The following APA 7th Edition corrections were made: 1) Appended '(Suppl. 3)' to the volume number '31' to indicate the journal supplement; 2) Added the '[Abstract]' description after the title; and 3) Added a colon after '65' to separate the abstract number from the title.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *C. Bruce Hunter: A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/S0003598X00070733
  - notes: Verified that this source exists. It is a book review written by Norman Hammond, published in the March 1976 issue of the journal Antiquity. The user's citation included the full bibliographic and publisher header of the review as the title. Under APA 7th Edition rules for book reviews, this header (such as pages of the book, agents, and price) is omitted, and the citation is formatted with a bracketed description: '[Review of the book *Title of Book*, by Author Initials. Lastname]'. Additionally, the journal title (*Antiquity*) and volume number (*50*) are italicized, while the issue number (197) is kept in regular text.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: The source was successfully verified. Corrected multiple punctuation and typographical errors in the authors' names ('Терещенко, Е. А. ,., & Устинова ., Н. С.' to 'Терещенко, Е. А., & Устинова, Н. С.') and changed the journal title from ALL CAPS to standard Russian title-case capitalization (*Тенденции развития науки и образования*) in accordance with APA 7th Edition rules.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: de Almeida, L. H. C., Nadur, M. A., de Almeida, P. P. S., Carrilho, E. M., Ventura, M. U., & de Freitas Fregonezi, G. A. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The article was successfully verified. The following formatting corrections were made to comply with APA 7th Edition rules: (1) Corrected the Portuguese surnames by properly integrating the lowercase preposition 'de' into the surnames (e.g., 'de Almeida' and 'de Freitas Fregonezi') instead of using an incorrect uppercase 'D.' as a middle initial. (2) Converted the journal title from ALL CAPS to Title Case.
- **v17** truth=`verified` predicted=`corrected`
  - ref: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - model correction: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, Article 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - notes: The source is real and the metadata is accurate. The reference has been corrected to comply with APA 7th edition guidelines, which require the word 'Article' (capitalized) to be placed before the article number instead of just listing the number like a page range.
- **v18** truth=`verified` predicted=`corrected`
  - ref: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - model correction: Fesenko, E., Pavlov, Ye., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - notes: The paper exists. Corrected Pavlov's initial from 'Y.' to 'Ye.' to match the official translation ('Ye. Pavlov') provided in the original publication's metadata. The spacing typo 'foot wallof' in the title has been retained as it reflects the official published and indexed title.
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). En camino hacia una meta santa: ser prolongadores de la misión. A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios sobre los Ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: The reference exists but was corrected. The full title actually includes a subtitle ('A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud') which was missing from the original reference. Additionally, in accordance with APA 7th Edition rules, the angle quotes (« ») around the article title were removed, and the journal name was formatted in Title Case.
- **c5** truth=`corrected` predicted=`unknown`
  - ref: Caro‐Vadillo, A., García‐Real, I., Payá‐Vicens, M. J., Sainz‐Rodríguez, Á., Rodríguez‐Franco, F., & Rodríguez‐Bertos, A. (2007). Fungal rhinitis caused by <i>Scedosporium apiospermum</i> in a labrador retriever. *Veterinary Record*, *157*(6), 175–177. https://doi.org/10.1136/vr.157.6.175
  - notes: Raw Response: {
  "status": "corrected",
  "corrected": "Caro-Vadillo, A., García-Real, I., Payá-Vicens, M. J., Sainz-Rodríguez, Á., Rodríguez-Franco, F., & Rodríguez-Bertos, A. (2005). Fungal rhinitis caused by *Scedosporium apiospermum* in a Labrador retriever. *Veterinary Record*, *157*(6), 175–177. https://doi.org/10.1136/vr.157.6.175",
  "notes": "The citation has been corrected: the publication year was updated from 2007 to 2005; the HTML tags (<i>) around the scientific name were changed to markdown asterisks (*); 'Labrador' was capitalized as it is a proper adjective; and non-standard hyphens in the authors' names were normalized."
 names were normalized to standard hyphens."
}
- **c15** truth=`corrected` predicted=`unknown`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: Raw Response: {
  "status": "corrected",
  "corrected": "Nishimura, K., Ookita, K., & Takemura, T. (1997). Kankyō to shōmei shisutemu: Kankyō hozen no kanten kara no ranpu 1 [Environment and lighting systems: Lamps from the viewpoint of environmental preservation 1]. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302. https://doi.org/10.2150/jieij1980.81.Appendix_302",
  "notes": "The referenced paper exists on J-STAGE but required several corrections: 1) The publication year is 1997, not 1999 (Volume 81 of the journal was published in 1997). 2) The original article was published in Japanese ('環境と照明システム. 環境保全の観点からのランプ1'). To comply with APA 7th Edition guidelines for non-English works, the transliterated Japanese title is provided first, followed by its English translation in square brackets. 3) The page number is simplified to '302' instead of '302–302' as it is a single-page abstract. 4) The DOI URL was corrected to match the official J-STAGE casing where 'Appendix' is capitalized."
1]."
}
- **c16** truth=`corrected` predicted=`verified`
  - ref: Klügl, F. (2006). Multiagentensimulation. Informatik-Spektrum, 29(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - model correction: Klügl, F. (2006). Multiagentensimulation. *Informatik-Spektrum*, *29*(6), 412–415. https://doi.org/10.1007/s00287-006-0115-7
  - notes: The reference is verified and is perfectly accurate. The journal title ('Informatik-Spektrum') and volume number ('29') have been formatted with markdown italics to fulfill APA 7th Edition style requirements.
- **h9** truth=`hallucinated` predicted=`unknown`
  - ref: Grumman, N., & Trennick, A. (2024). Emergent grammar in low-resource creole corpora. *Review of Distributed Systems Theory*, *19*(2), 109–119. https://doi.org/10.9999/refcheck.fake.9.479540
  - notes: Raw Response: {
  "status": "hallucinated",
  "corrected": "",
  "notes": "The reference does not exist. The authors, article title, and journal could not be found, and the DOI is explicitly marked as 'fake' (refcheck.fake.9.479540)."
0)."
"
}
