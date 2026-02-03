import { supabase, BingoTemplate, BingoGame } from './supabase';

export const bingoService = {
  async getTemplates(): Promise<BingoTemplate[]> {
    const { data, error } = await supabase
      .from('bingo_templates')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }

    return data || [];
  },

  async getTemplate(id: string): Promise<BingoTemplate | null> {
    const { data, error } = await supabase
      .from('bingo_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching template:', error);
      throw error;
    }

    return data;
  },

  async getTemplateByCode(code: string): Promise<BingoTemplate | null> {
    const { data, error } = await supabase
      .from('bingo_templates')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('Error fetching template by code:', error);
      throw error;
    }

    return data;
  },

  async createCustomTemplate(name: string, description: string, items: string[]): Promise<BingoTemplate> {
    const shareCode = generateShareCode();

    const { data, error } = await supabase
      .from('bingo_templates')
      .insert({
        name,
        description,
        items,
        is_custom: true,
        code: shareCode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating custom template:', error);
      throw error;
    }

    return data;
  },

  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('bingo_templates')
      .delete()
      .eq('id', id)
      .eq('is_custom', true);

    if (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },

  async generateShareCode(templateId: string): Promise<string> {
    const template = await this.getTemplate(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    if (template.code) {
      return template.code;
    }

    const shareCode = generateShareCode();

    const { error } = await supabase
      .from('bingo_templates')
      .update({ code: shareCode })
      .eq('id', templateId);

    if (error) {
      console.error('Error generating share code:', error);
      throw error;
    }

    return shareCode;
  },

  async createGame(templateId: string): Promise<BingoGame> {
    const template = await this.getTemplate(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    const { data, error } = await supabase
      .from('bingo_games')
      .insert({
        template_id: templateId,
        template_name: template.name,
        marked_cells: [],
        items: template.items,
        bingo_count: 0,
        is_started: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
      throw error;
    }

    return data;
  },

  async updateGame(id: string, updates: Partial<BingoGame>): Promise<BingoGame> {
    const { data, error } = await supabase
      .from('bingo_games')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating game:', error);
      throw error;
    }

    return data;
  },

  async getActiveGames(): Promise<BingoGame[]> {
    const { data, error } = await supabase
      .from('bingo_games')
      .select('*')
      .eq('completed', false)
      .order('started_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error fetching active games:', error);
      throw error;
    }

    return data || [];
  },

  async getGame(id: string): Promise<BingoGame | null> {
    const { data, error } = await supabase
      .from('bingo_games')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game:', error);
      throw error;
    }

    return data;
  },

  async deleteGame(id: string): Promise<void> {
    const { error } = await supabase
      .from('bingo_games')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  },

  async getGameHistory(): Promise<BingoGame[]> {
    const { data, error } = await supabase
      .from('bingo_games')
      .select('*')
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching game history:', error);
      throw error;
    }

    return data || [];
  },

  async submitFeedback(message: string, email?: string): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .insert({ message, email });

    if (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },
};

function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
