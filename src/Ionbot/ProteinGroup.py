class ProteinGroup:        
    def __init__(self, sequences, protein_group_id, file_psm_col_names, protein_ids, ionbot_peptides):
        self.fasta_sequences = sequences
        self.id = protein_group_id
        self.protein_ids = protein_ids
        self.peptides = ionbot_peptides
        self.file_psm_col_names = file_psm_col_names
        self.rows = [peptide.row for peptide in self.peptides]
        if self.rows:
            self.is_validated = True
        else:
            self.is_validated = False

