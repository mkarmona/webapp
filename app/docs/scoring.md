The Open Targets Platform allows biomedical researchers to prioritise targets based on the strength of their association with a disease. These are some of the questions you might want to answer

*   Which targets have the most evidence for association with a specific disease?
*   What is the relative weight of evidence between different targets for a disease?

If so, you can use our platform and assess the score we’ve calculated to quantify the key factors relating to the confidence in the association.



#### The Association Score

Our association score between a target and a disease is a numerical value varying from 0 to 1, which indicates the strength of the association. A score of 0 corresponds to no evidence supporting an association, whereas a score of 1 refers to the strongest association. Throughout the pages in the Open Targets Platform we also indicate the score in shades of blue: the darker the blue, the stronger the association (i.e. 1).



#### Computing the Association Score

We start by generating a score for each evidence from different data sources (e.g. GWAS catalog, EVA) within a data type (e.g. Genetic associations). We define the evidence score as:

s = F * S * C

where

s = score

F = frequency, the relative occurrence of a target-disease evidence

S = severity, the magnitude or strength of the effect described by the evidence

C = confidence, overall confidence for the observation that generates the target-disease evidence

The evidence score summarises the strength of the evidence and depends on factors that affect the relative strength of an evidence. These factors are summarised below:

<table class="table">

<thead>

<tr>

<th>Data type</th>

<th>Evidence scores and factors affecting their relative strength</th>

</tr>

</thead>

<tbody>

<tr>

<td>Genetic associations</td>

<td>GWAS Catalog (functional consequence score, normalised p value and normalised sample size), European Variation Archive germline variants(functional consequence score), UniProt (curator inference score based on how strong the evidence for the gene's involvement in the disease is: not strong - 0.5 - , strong - 1)</td>

</tr>

<tr>

<td>Somatic mutations</td>

<td>Cancer Gene Census and EVA (both based on the functional consequence score), IntOgen (binned score based on tumour type category, ranging from 0.25 if the gene exhibits several signals of positive selections in the tumour, to 0.75 if in addition to a signal of positive selection, the gene is functionally connected to other genes with evidence A and B in the tumor type)</td>

</tr>

<tr>

<td>Drugs</td>

<td>ChEMBL (Clinical trail phase binned score. Phase 0: 0.89, Phase I: 0.01, Phase II: 0.02, Phase III: 0.07, Phase IV: 1/0)</td>

</tr>

<tr>

<td>Affected pathways</td>

<td>Reactome (curator confidence score)</td>

</tr>

<tr>

<td>RNA Expression</td>

<td>Expression Atlas score (normalised p-value, normalised expression fold change and normalised percentile rank), rank)</td>

</tr>

<tr>

<td>Text mining</td>

<td>Europe PMC (confidence score based on weighting document sections, sentence locations and title for full text articles and abstracts (Kafkas et al 2016)</td>

</tr>

<tr>

<td>Animal models</td>

<td>[Phenodigm](http://database.oxfordjournals.org/content/2013/bat025) ([similarity score between a mouse model and a human disease](http://database.oxfordjournals.org/content/2013/bat025) [described by Smedley et al 2013)](http://database.oxfordjournals.org/content/2013/bat025.full#sec-3))</td>

</tr>

</tbody>

</table>

Once we have the scores for each evidence, we calculate an overall score for a data type (e.g. Genetic associations). In this step, we take into account that although multiple occurrences of evidence can suggest a strong association, the inclusion of further new evidence should not have a great impact on the overall score. For this reason, we calculate the sum of the [harmonic progression](https://en.wikipedia.org/wiki/Harmonic_progression_(mathematics)) of each score and adjust the contribution of each of them using a heuristic weighting. Throughout this process, the value of the score is always capped at 1, the most confident association.

We’ve implemented this framework for the current version of the Platform but we'll continue to explore and work on alternative statistical models to keep providing robust scoring systems for target-disease associations.


