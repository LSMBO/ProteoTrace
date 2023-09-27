class Protein:
    def __init__(self, sequences, protein_id, psms_from_protein_sets_col_name, rows, proline_peptides):
        self.fasta_sequences = sequences
        self.id = protein_id
        self.proline_peptides = proline_peptides
        self.psms_from_protein_sets_col_name = psms_from_protein_sets_col_name
        self.description, self.sequence = self.search_sequence_infos()
        if self.sequence:
            self.length = len(self.sequence)
            self.rows = rows
            if self.rows:
                self.is_validated = True
                self.protein_group = self.rows[0][self.psms_from_protein_sets_col_name.index('protein_set_id')]
                self.peptides = self.search_peptides()
                self.modifications = self.search_modifications()
            else:
                self.is_validated = False

    def search_sequence_infos(self):
        for sequence in self.fasta_sequences:
            if sequence["id"] == self.id:
                return sequence["description"], sequence["sequence"]
        return None, None
    
    def search_peptides(self):
        peptides = []
        for peptide in self.proline_peptides:
            if self.id in peptide.proteins:                
                peptides.append(peptide)
        return peptides

    
    def search_modifications(self):
        modifications = []
        for peptide in self.peptides:  
            for peptide_modification in peptide.modifications:
                modifications.append(peptide_modification)
        return modifications
    
    def merge_coordinate(self, coords):
        merged_coords = []
        start, end = coords[0]
        for coord in coords[1:]:
            if coord[0] <= end:
                end = max(end, coord[1])
            else:
                merged_coords.append((start, end))
                start, end = coord

        merged_coords.append((start, end))
        return merged_coords
    
            
    def get_sequence_coverage_coordinates(self):
        identified_coordinates = []
        for peptide in self.peptides:
            start = self.sequence.find(peptide.sequence)
            stop = start + peptide.length - 1
            identified_coordinates.append((start, stop))
        identified_coordinates = sorted(identified_coordinates, key=lambda x: x[0])
        identified_coordinates = self.merge_coordinate(identified_coordinates)
        return identified_coordinates
    
    
    def get_sequence_coverage(self, output_file=None):
        sequence = self.sequence
        coords = self.get_sequence_coverage_coordinates()

        line_coverage = ""        
        for i in range(len(sequence)):
            if any(start <= i <= end for start, end in coords):
                line_coverage += "+"
            else:
                line_coverage += "-"

        fasta_str = f">{self.description}\n{sequence}\n{line_coverage}"

        if output_file:
            with open(output_file, "a") as f:
                f.write(fasta_str)
        else:
            print(fasta_str)
    


    def get_coverage_stats(self):
        sequence = self.sequence
        coords = self.get_sequence_coverage_coordinates()
        covered_count = 0
        for i in range(0, len(sequence)):
            if any(start <= i <= end for start, end in coords):
                covered_count += 1
        coverage_percentage = (covered_count / len(sequence)) * 100
        print(f"Protein ID: {self.id}, Coverage: {coverage_percentage:.2f}%")
