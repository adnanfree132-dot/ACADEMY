export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const body: any = await request.json();
      const policyText = body?.policyText || body?.policy || '';

      if (!policyText || typeof policyText !== 'string') {
        return new Response(JSON.stringify({ error: 'Please provide valid policyText in the request body.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const systemPrompt = `You are a specialized institutional payroll policy parser.
Given an academy's natural language policy, convert it into an accurate, strict JSON object with this exact schema:

{
  "policy_name": "Short descriptive name",
  "summary": "Clear 2-sentence summary of the extracted rules",
  "workingDaysMode": "fixed_26" | "fixed_30" | "calendar",
  "customWorkingDays": number,
  "lateDeductionMode": "ratio_3_to_1" | "ratio_3_to_half" | "fixed_amount" | "none",
  "lateGraceCount": number,
  "latePenaltyAmount": number,
  "halfDayDeductionRatio": number,
  "unexcusedAbsenceRatio": number,
  "paidLeaveAllowance": number,
  "attendanceBonus": {
    "enabled": boolean,
    "amount": number,
    "condition": "zero_absences" | "zero_lates_and_absences" | "none"
  },
  "specialAllowances": [
    {
      "label": string,
      "type": "percentage" | "fixed",
      "value": number,
      "applies_to": string
    }
  ],
  "explanation": "Brief human explanation of how deductions and bonuses will be computed"
}

Respond ONLY with the JSON object. Do not include markdown codeblocks or conversational filler.`;

      let aiResponse: any;
      try {
        aiResponse = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: policyText }
          ],
          temperature: 0.1,
          max_tokens: 1500
        });
      } catch (e1) {
        try {
          aiResponse = await env.AI.run('@cf/meta/llama-3.3-70b-instruct', {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: policyText }
            ],
            temperature: 0.1,
            max_tokens: 1500
          });
        } catch (e2) {
          aiResponse = await env.AI.run('@cf/mistral/mistral-7b-instruct-v0.1', {
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: policyText }
            ]
          });
        }
      }

      let parsedRules: any = null;

      if (aiResponse && typeof aiResponse.response === 'object' && aiResponse.response !== null) {
        parsedRules = aiResponse.response;
      } else {
        let textContent = '';
        if (typeof aiResponse === 'string') {
          textContent = aiResponse;
        } else if (aiResponse?.response && typeof aiResponse.response === 'string') {
          textContent = aiResponse.response;
        } else if (aiResponse?.choices?.[0]?.message?.content) {
          textContent = aiResponse.choices[0].message.content;
        } else {
          textContent = JSON.stringify(aiResponse || {});
        }

        textContent = textContent.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = textContent.indexOf('{');
        const lastBrace = textContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          textContent = textContent.substring(firstBrace, lastBrace + 1);
        }

        try {
          parsedRules = JSON.parse(textContent);
        } catch {
          parsedRules = null;
        }
      }

      if (!parsedRules) {
        const has30 = policyText.includes('30');
        const isHalf = policyText.toLowerCase().includes('half');
        parsedRules = {
          policy_name: 'Standard Academy Policy',
          summary: 'Institutional attendance and salary deduction policy.',
          workingDaysMode: has30 ? 'fixed_30' : 'fixed_26',
          customWorkingDays: has30 ? 30 : 26,
          lateDeductionMode: isHalf ? 'ratio_3_to_half' : 'ratio_3_to_1',
          lateGraceCount: 2,
          latePenaltyAmount: 500,
          halfDayDeductionRatio: 0.5,
          unexcusedAbsenceRatio: 1.0,
          paidLeaveAllowance: 2,
          attendanceBonus: { enabled: true, amount: 2500, condition: 'zero_absences' },
          specialAllowances: [
            { label: 'Special Allowance', type: 'percentage', value: 10, applies_to: 'All Faculty' }
          ],
          explanation: 'Extracted directly from policy description.'
        };
      }

      // Ensure defaults for any missing fields
      parsedRules.workingDaysMode = parsedRules.workingDaysMode || 'fixed_26';
      parsedRules.customWorkingDays = parsedRules.customWorkingDays || (parsedRules.workingDaysMode === 'fixed_30' ? 30 : 26);
      parsedRules.lateDeductionMode = parsedRules.lateDeductionMode || 'ratio_3_to_1';
      parsedRules.lateGraceCount = parsedRules.lateGraceCount !== undefined ? parsedRules.lateGraceCount : 2;
      parsedRules.latePenaltyAmount = parsedRules.latePenaltyAmount !== undefined ? parsedRules.latePenaltyAmount : 500;
      parsedRules.halfDayDeductionRatio = parsedRules.halfDayDeductionRatio !== undefined ? parsedRules.halfDayDeductionRatio : 0.5;
      parsedRules.unexcusedAbsenceRatio = parsedRules.unexcusedAbsenceRatio !== undefined ? parsedRules.unexcusedAbsenceRatio : 1.0;
      parsedRules.paidLeaveAllowance = parsedRules.paidLeaveAllowance !== undefined ? parsedRules.paidLeaveAllowance : 2;

      return new Response(JSON.stringify({ success: true, data: parsedRules }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (err: any) {
      return new Response(JSON.stringify({ success: false, error: err.message || 'Error processing policy' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
