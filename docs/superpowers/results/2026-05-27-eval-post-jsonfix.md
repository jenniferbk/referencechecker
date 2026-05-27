# Model A/B Accuracy Report

_Generated 2026-05-27T18:58:50.739Z_

## Summary

| model                  | overall | verified | corrected | hallucinated | fix✓(approx) | unknown | false-acc | misses | avg-lat | tokens |
|------------------------|---------|----------|-----------|--------------|--------------|---------|-----------|--------|---------|--------|
| gemini-3.1-pro-preview | 78.3%   | 40.0%    | 95.0%     | 100.0%       | 100.0%       | 0       | 1         | 0      | 22354ms | 154465 |
| gemini-3.5-flash       | 80.0%   | 45.0%    | 95.0%     | 100.0%       | 100.0%       | 0       | 0         | 0      | 15781ms | 154442 |

## gemini-3.1-pro-preview

- Overall accuracy: **78.3%** (47/60)
- False accusations (real → flagged fake): **1**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 19/19
- Unknown/failed verdicts: 0

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 8        | 11        | 1            | 0       |
| corrected         | 0        | 19        | 1            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (13)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝, 慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177–178. https://doi.org/10.26549/fm.v1i2.353
  - notes: The reference exists, but the author's name was missing a character (慧敏 instead of 慧) and the page range was incomplete (should be 177-178 instead of just 177).
- **v4** truth=`verified` predicted=`hallucinated`
  - ref: Th. L., & Zonnenberg, J. M. E. M. A. (1935). Boekbespreking. *De Economist*, *84*(1), 841–848. https://doi.org/10.1007/bf02201120
  - notes: Searches for the provided DOI (10.1007/bf02201120), the author combination ('Th. L.' and 'Zonnenberg'), and the specific publication details in Volume 84 of 'De Economist' yielded no results. The DOI is entirely invalid and does not exist in the Crossref or Springer databases. Furthermore, the first author's name 'Th. L.' is improperly formed for a real citation (where 'Th.' would typically represent a first name abbreviation like Theodore, not a surname), and page 841 is highly unlikely to fall within Issue 1 of a continuously paginated journal from that era. This indicates the reference is completely hallucinated.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: Verified that the source exists. Corrected the volume and issue number formatting: APA 7th Edition requires omitting abbreviations such as 'Vol.' or 'No.' before the numbers. The volume number should be italicized, immediately followed by the non-italicized issue number in parentheses.
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The reference exists and is generally well-formatted. However, APA 7th Edition requires author names to be written in standard capitalization (Title Case for surnames) rather than ALL CAPS. The author names have been corrected.
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - notes: Verified that the source exists. Corrected a punctuation error: in APA 7th Edition, if an article title ends with a question mark, you do not add an additional period after it.
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*(Suppl. 3), A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - notes: Verified that the source exists (it is a conference abstract published in a journal supplement). The original citation was mostly correct but missing the supplement number. According to APA 7th Edition rules for journal supplements, the supplement number must be enclosed in non-italicized parentheses immediately following the italicized volume number.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - notes: The source is a valid book review published in Antiquity. However, the provided reference mistakenly uses the book's raw publishing metadata (pages, plates, price, agents, etc.) as the article title—a common database export error. According to APA 7th Edition rules for untitled book reviews, the title should be replaced with a bracketed description formatted as: [Review of the book *Title of book*, by A. A. Author].
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: Verified the article exists. Corrected erratic punctuation in the authors' names (removed ',.,' and '.,') and changed the journal title from ALL CAPS to standard sentence case per APA 7 guidelines for Russian publications. Applied proper markdown italics.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C. d., Nadur, M. A., Almeida, P. P. S. d., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. d. F. (2025). Cell protector, cobalt, and molybdenum in association with *Bradyrhizobium* and *Azospirillum* in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The reference exists, but required APA 7th edition formatting adjustments. The journal title was corrected from ALL CAPS to Title Case. The bacterial genus names ('Bradyrhizobium' and 'Azospirillum') in the article title were italicized, as scientific names must be formatted in italics. Additionally, the 'D.' initials for the Portuguese preposition 'de' in the author names were corrected to lowercase 'd.'.
- **v17** truth=`verified` predicted=`corrected`
  - ref: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - model correction: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, Article 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - notes: The reference exists and is mostly accurate. However, under APA 7th Edition rules, when a journal uses article numbers instead of a continuous page range, the word 'Article' must precede the article number.
- **v18** truth=`verified` predicted=`corrected`
  - ref: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - model correction: Fesenko, E., Pavlov, Ye., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wall of mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - notes: Verified the source's existence. Corrected a typographical error in the article title ('wallof' to 'wall of') according to APA 7th guidelines on obvious typos, and updated the transliterated initial for Yevhen Pavlov from 'Y.' to 'Ye.' to match how it appears on the official English publication.
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). En camino hacia una meta santa: Ser prolongadores de la misión. A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: Verified the source exists. Corrected APA formatting by removing the guillemets (« ») around the article title, capitalizing 'Ser' after the colon in the title, and adding the missing subtitle. Journal title and volume remain correctly italicized.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: Searches for the title, authors, and provided DOI yielded no results. Additionally, there is a chronological discrepancy in the citation data: Volume 81 of the Journal of the Illuminating Engineering Institute of Japan corresponds to the year 1997, not 1999 (which would be Volume 83). The reference appears structurally plausible but is entirely fabricated.

## gemini-3.5-flash

- Overall accuracy: **80.0%** (48/60)
- False accusations (real → flagged fake): **0**
- Misses (fake → passed as verified): **0**
- Fix restored (approx, among corrected-caught): 19/19
- Unknown/failed verdicts: 0

### Confusion matrix

| truth \ predicted | verified | corrected | hallucinated | unknown |
|-------------------|----------|-----------|--------------|---------|
| verified          | 9        | 11        | 0            | 0       |
| corrected         | 0        | 19        | 1            | 0       |
| hallucinated      | 0        | 0         | 20           | 0       |

### Disagreements with truth (12)

- **v3** truth=`verified` predicted=`corrected`
  - ref: 郝, 慧. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177. https://doi.org/10.26549/fm.v1i2.353
  - model correction: 郝慧敏. (2017). 日本企业人本管理给中国企业的启示. *财经与管理*, *1*(2), 177–178. https://doi.org/10.26549/fm.v1i2.353
  - notes: The author's name was corrected from '郝, 慧' to '郝慧敏' (for Chinese citations in Chinese characters, no comma is used between the family and given name). The page range was also corrected from '177' to '177–178' using an en-dash.
- **v8** truth=`verified` predicted=`corrected`
  - ref: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *No 26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - model correction: Assadi, D., Ashta, A., & Jung, A. (2018). A tale of three musketeers of alternative finance: Stagnating microcredit, growing P2P online lending and striving for slow money. *Journal of Innovation Economics & Management*, *26*(2), 13–36. https://doi.org/10.3917/jie.pr1.0030
  - notes: The source exists and the details are correct. However, the volume and issue formatting was corrected to comply with APA 7th edition rules: 'No' was removed, the volume number '26' was italicized, and the issue number '2' was kept in parentheses without italics (i.e., *26*(2) instead of *No 26*(2)).
- **v10** truth=`verified` predicted=`corrected`
  - ref: MORRIS, A., MORTON, N. E., COLLINS, A., LAWRENCE, S., & MACPHERSON, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - model correction: Morris, A., Morton, N. E., Collins, A., Lawrence, S., & Macpherson, J. N. (1995). Evolutionary dynamics of the FMR1 locus. *Annals of Human Genetics*, *59*(3), 283–289. https://doi.org/10.1111/j.1469-1809.1995.tb00748.x
  - notes: The reference exists, but the authors' names were formatted in all-caps. They have been corrected to standard title case as required by APA 7th Edition.
- **v12** truth=`verified` predicted=`corrected`
  - ref: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)?. *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/s0164-0704(02)00013-7
  - model correction: Hjelm, G. (2002). Is private consumption growth higher (lower) during periods of fiscal contractions (expansions)? *Journal of Macroeconomics*, *24*(1), 17–39. https://doi.org/10.1016/S0164-0704(02)00013-7
  - notes: Removed the unnecessary period after the question mark at the end of the article title (APA 7th does not use a period after a title ending in a question mark), and capitalized the 'S' in the DOI to match the publisher's standard format.
- **v13** truth=`verified` predicted=`corrected`
  - ref: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). 65 The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer. *International Journal of Gynecological Cancer*, *31*, A331. https://doi.org/10.1136/ijgc-2021-esgo.587
  - model correction: Sobočan, M., Sprung, S., Schatz, C., Knez, J., Kavalar, R., Takač, I., & Haybaeck, J. (2021). The prognostic significance of eukaryotic translation initiation factors (eIFs) in ovarian cancer [Abstract]. *International Journal of Gynecological Cancer*, *31*(Suppl. 3), A331. https://doi.org/10.1136/ijgc-2021-ESGO.587
  - notes: The reference was corrected to remove the abstract number ('65') from the title, add the bracketed descriptor '[Abstract]' after the title, include the supplement number '(Suppl. 3)' next to the volume number, and update the DOI to its standard capitalization.
- **v14** truth=`verified` predicted=`corrected`
  - ref: Hammond, N. (1976). C. Bruce Hunter: A guide to ancient Maya ruins. Norman: University of Oklahoma Press, 1975. Agents: Bailey & Swinfen, Folkestone, Kent. 349 pp., 23 pls. (in colour), 132 figs., 18 maps and site plans. $4.95, £3.50 (paperback). *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - model correction: Hammond, N. (1976). [Review of the book *A guide to ancient Maya ruins*, by C. B. Hunter]. *Antiquity*, *50*(197), 76–77. https://doi.org/10.1017/s0003598x00070733
  - notes: The citation refers to a book review written by Norman Hammond of C. Bruce Hunter's book 'A Guide to Ancient Maya Ruins', published in the journal 'Antiquity' (1976). The original citation contains excessive bibliographic and publisher metadata (e.g., page counts, plates, figures, pricing, and UK distributors) that are not included in standard APA 7th Edition style. The reference has been corrected to follow the standard APA 7th Edition format for book reviews.
- **v15** truth=`verified` predicted=`corrected`
  - ref: Терещенко, Е. А. ,., & Устинова ., Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *ТЕНДЕНЦИИ РАЗВИТИЯ НАУКИ И ОБРАЗОВАНИЯ*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - model correction: Терещенко, Е. А., & Устинова, Н. С. (2023). Обеспечение юридически значимого электронного документооборота. *Тенденции развития науки и образования*, *97*(7), 187–191. https://doi.org/10.18411/trnio-05-2023-415
  - notes: The article exists and has been verified. The citation was corrected to fix severe typos in the authors' names ('Е. А. ,.,' to 'Е. А.,' and 'Устинова ., Н. С.' to 'Устинова, Н. С.'), and to adjust the journal name from all caps to proper standard capitalization in Russian.
- **v16** truth=`verified` predicted=`corrected`
  - ref: Almeida, L. H. C. D., Nadur, M. A., Almeida, P. P. S. D., Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. D. F. (2025). Cell protector, cobalt, and molybdenum in association with Bradyrhizobium and Azospirillum in soybean cultivation. *OBSERVATÓRIO DE LA ECONOMÍA LATINOAMERICANA*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - model correction: Almeida, L. H. C. de, Nadur, M. A., Almeida, P. P. S. de, Carrilho, E. M., Ventura, M. U., & Fregonezi, G. A. de F. (2025). Cell protector, cobalt, and molybdenum in association with *Bradyrhizobium* and *Azospirillum* in soybean cultivation. *Observatório de la Economía Latinoamericana*, *23*(2), e9033. https://doi.org/10.55905/oelv23n2-096
  - notes: The citation is valid, but required several APA 7th edition formatting corrections: the journal title was changed from all-caps to title case; the lowercase particle 'de' was restored for the author names instead of using the capitalized initial 'D' to correctly follow Portuguese naming conventions; and the genus names '*Bradyrhizobium*' and '*Azospirillum*' in the article title were italicized.
- **v17** truth=`verified` predicted=`corrected`
  - ref: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - model correction: Dixit, N. N., McFarland, D. C., Fisher, M. B., Cole, J. H., & Saul, K. R. (2020). Integrated iterative musculoskeletal modeling predicts bone morphology following brachial plexus birth injury (BPBI). *Journal of Biomechanics*, *103*, Article 109658. https://doi.org/10.1016/j.jbiomech.2020.109658
  - notes: The reference is accurate and exists. In APA 7th edition, when a journal article has an article number (or e-locator) instead of a page range, the word 'Article' must be included before the article number.
- **v18** truth=`verified` predicted=`corrected`
  - ref: Fesenko, E., Pavlov, Y., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wallof mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - model correction: Fesenko, E., Pavlov, Ye., & Novak, A. (2021). Influence of main mining-geological and mining-technical parameters on rock destruction processes in the foot wall of mine workings. *Collection of Research Papers of the National Mining University*, *65*, 60–68. https://doi.org/10.33271/crpnmu/65.060
  - notes: Verified that the paper exists. Corrected the author initial for Pavlov from 'Y.' to 'Ye.' to match the official transliteration in the English version of the paper. Also fixed a typo in the article title where 'foot wallof' was merged into one word; the original publication uses 'foot wall of'.
- **v19** truth=`verified` predicted=`corrected`
  - ref: García de la Cuerda, A. (2012). «En camino hacia una meta santa: ser prolongadores de la misión». *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - model correction: García de la Cuerda, A. (2012). En camino hacia una meta santa: Ser prolongadores de la misión: A propósito de la homilía del Papa Benedicto XVI en la Misa con los seminaristas de la Jornada Mundial de la Juventud. *Seminarios sobre los ministerios en la Iglesia*, *58*(203), 27–40. https://doi.org/10.52039/seminarios.v58i203.322
  - notes: The reference exists, but some APA 7th Edition formatting corrections were needed. Guillemets (« ») were removed from the article title as APA style does not use quotation marks for titles in the reference list. The first word after each colon ('Ser', 'A') was capitalized, and proper nouns ('Papa Benedicto XVI', 'Jornada Mundial de la Juventud') were kept capitalized. Additionally, the full subtitle of the article was added to make the citation complete.
- **c15** truth=`corrected` predicted=`hallucinated`
  - ref: Nishimura, K., Ookita, K., & Takemura, T. (1999). Incandescent lamps and Fluorescent lamps for preservation of good environment. *Journal of the Illuminating Engineering Institute of Japan*, *81*(Appendix), 302–302. https://doi.org/10.2150/jieij1980.81.appendix_302
  - notes: This reference is a hallucinated conflation of two separate articles published in 1997 (Volume 81, Issue 9) of the Journal of the Illuminating Engineering Institute of Japan: 1) '白熱電球と環境保全' (Incandescent Lamps and Environmental Preservation) by Satoshi Takemura (pp. 831–833, DOI: 10.2150/jieij1980.81.9_831) and 2) '蛍光ランプと環境保全' (Fluorescent Lamps and Environmental Preservation) by Keiichi Nishimura and Koji Ookita (pp. 834–839, DOI: 10.2150/jieij1980.81.9_834). There is no combined paper from 1999, nor does the DOI 10.2150/jieij1980.81.appendix_302 exist.
