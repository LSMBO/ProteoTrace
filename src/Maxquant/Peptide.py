class Peptide:
    def __init__(self, sequences, peptide_id, file_peptides_col_names, row):
        self.fasta_sequences = sequences
        self.id = peptide_id
        self.file_peptides_col_names = file_peptides_col_names
        self.peptide_row = row
        self.sequence = self.peptide_row[self.file_peptides_col_names.index('Sequence')]
        self.modifications = self.read_modifications(self.peptide_row[self.file_peptides_col_names.index('Modifications')])
        self.length = len(self.sequence)
        self.spectrum_file = self.peptide_row[self.file_peptides_col_names.index('Raw file')]
        
    def read_modifications(self, cell):  
        if cell != "Unmodified":      
            return [cell]
        return []
    
