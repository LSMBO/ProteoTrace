class Peptide:
    def __init__(self, sequences, peptide_id, psms_from_protein_sets_col_name, row):
        self.fasta_sequences = sequences
        self.id = peptide_id
        self.psms_from_protein_sets_col_name = psms_from_protein_sets_col_name
        self.peptide_row = row
        self.sequence = self.peptide_row[self.psms_from_protein_sets_col_name.index('sequence')]
        self.modifications = self.read_modifications(self.peptide_row[self.psms_from_protein_sets_col_name.index('modifications')])
        self.length = len(self.sequence)
        self.proteins = self.search_proteins()
        self.protein_set_id = self.peptide_row[self.psms_from_protein_sets_col_name.index('protein_set_id')]
        
    def search_proteins(self):
        if "samesets_accessions" in self.psms_from_protein_sets_col_name and "subsets_accessions" in self.psms_from_protein_sets_col_name:
            sameset_col_name_index = self.psms_from_protein_sets_col_name.index("samesets_accessions")
            subset_col_name_index = self.psms_from_protein_sets_col_name.index("subsets_accessions")
            sameset_list = self.peptide_row[sameset_col_name_index].split(';')
            subset_list = []
            if self.peptide_row[subset_col_name_index]:
                subset_list = self.peptide_row[subset_col_name_index].split(';')
            return [elem.lstrip(' >') for elem in sameset_list + subset_list] 
            
    def read_modifications(self, cell):
        modifications = []
        if cell:
            raw_modifs = cell.split(';')
            for raw_modif in raw_modifs:
                modif = {}
                modif_parts = raw_modif.strip().split(' ')
                if len(modif_parts) == 2:
                    modif['type'] = modif_parts[0]
                    modif['residu'] = modif_parts[1].strip('()')[0]
                    modif['position'] = int(modif_parts[1].strip('()')[1:])
                    modifications.append(modif)
        return modifications
