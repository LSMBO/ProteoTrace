class Peptide:
    def __init__(self, sequences, peptide_id, file_psm_col_names, row):
        self.fasta_sequences = sequences
        self.id = peptide_id
        self.file_psm_col_names = file_psm_col_names
        self.row = row
        self.database_sequence = self.row[self.file_psm_col_names.index('database_peptide')]
        self.matched_sequence = self.row[self.file_psm_col_names.index('matched_peptide')]
        self.modifications = self.read_modifications(self.row[self.file_psm_col_names.index('modifications')])
        self.length = len(self.database_sequence)
        self.spectrum_title = self.row[self.file_psm_col_names.index('spectrum_title')]
        self.spectrum_file = self.row[self.file_psm_col_names.index('spectrum_file')]     
        self.proteins = self.search_proteins()
        
    def read_modifications(self, cell):
        modifications = []
        if cell:
            entries = cell.split('|')
            for i in range(0, len(entries), 2):
                mod_position = entries[i]
                if mod_position.isdigit():
                    mod_position = int(mod_position)
                mod_type = entries[i+1].split('[')
                if mod_type[0]:
                    mod_type = mod_type[0]
                else:
                    mod_type = mod_type[1].split(']')[-1]
                mod_residu = entries[i+1][-2]
                modification = {
                    'type': mod_type,
                    'residu': mod_residu,
                    'position': mod_position
                }
                modifications.append(modification)
        return modifications
    
    def search_proteins(self):
        proteins = []        
        index_protein = self.file_psm_col_names.index("proteins")
        raw_prots = self.row[index_protein].split('||')
        for raw_prot in raw_prots:
            protein_id = raw_prot.split('((')[0]
            if not protein_id.startswith('decoy_') and not protein_id.startswith("sp|"):
                proteins.append(protein_id)      
        return proteins
        
