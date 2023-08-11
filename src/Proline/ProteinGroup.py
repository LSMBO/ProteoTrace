class ProteinGroup:        
    def __init__(self, sequences, protein_group_id, protein_file_col_name, rows, proline_peptides):
        self.fasta_sequences = sequences
        self.id = protein_group_id
        self.proline_peptides = proline_peptides
        self.protein_file_col_name = protein_file_col_name
        self.rows = rows
        if self.rows:
            self.is_validated = True
            self.peptides = self.search_peptides()
        else:
            self.is_validated = False


    def search_peptides(self):
        peptides = []
        for peptide in self.proline_peptides:
            if self.id == peptide.protein_set_id:                
                peptides.append(peptide)
        return peptides
    


