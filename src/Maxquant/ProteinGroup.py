class ProteinGroup:        
    def __init__(self, sequences, protein_group_id, protein_file_col_name, rows, maxquant_peptides):
        self.fasta_sequences = sequences
        self.id = protein_group_id
        self.protein_ids = self.id.split(';')
        self.maxquant_peptides = maxquant_peptides
        self.protein_file_col_name = protein_file_col_name
        self.rows = rows
        if self.rows:
            self.is_validated = True
            self.peptides = self.search_peptides()
        else:
            self.is_validated = False


    def search_peptides(self):
        peptide_dict = {peptide.id: peptide for peptide in self.maxquant_peptides}
        peptides = []
        for row in self.rows:
            peptide_ids = row[self.protein_file_col_name.index('Peptide IDs')].split(';')
            for peptide_id in peptide_ids:
                peptide = peptide_dict.get(peptide_id)
                if peptide is not None:
                    peptides.append(peptide)
        return peptides
