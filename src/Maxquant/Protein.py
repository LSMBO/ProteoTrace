class Protein:
    def __init__(self, sequences, protein_id, protein_file_col_name, rows, maxquant_peptides):
        self.fasta_sequences = sequences
        self.id = protein_id
        self.maxquant_peptides = maxquant_peptides
        self.protein_file_col_name = protein_file_col_name
        self.description, self.sequence = self.search_sequence_infos()
        if self.sequence:
            self.length = len(self.sequence)
            self.rows = rows
            if self.rows:
                self.is_validated = True
                self.protein_group = self.rows[0][self.protein_file_col_name.index('id')]
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
        peptide_dict = {peptide.id: peptide for peptide in self.maxquant_peptides}
        peptides = []
        for row in self.rows:
            peptide_ids_pg = row[self.protein_file_col_name.index('Mod. peptide IDs')].split(';')
            peptide_sequences_pg = row[self.protein_file_col_name.index('Peptide sequences')].split(';')
            peptide_ids = []
            for index in range(len(peptide_sequences_pg)):
                if peptide_sequences_pg[index] in self.sequence:
                    peptide_ids.append(peptide_ids_pg[index])
            for peptide_id in peptide_ids:
                peptide = peptide_dict.get(peptide_id)
                if peptide is not None:
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

        lines = []
        for i in range(0, len(sequence), 80):
            line_sequence = sequence[i:i + 80]
            line_coverage = ""
            for j in range(len(line_sequence)):
                pos = i + j
                if any(start <= pos <= end for start, end in coords):
                    line_coverage += "+"
                else:
                    line_coverage += "-"
            lines.append(line_sequence)
            lines.append(line_coverage)

        fasta_str = f">{self.description}\n" + "\n".join(lines) + "\n"

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
